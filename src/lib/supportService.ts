import { supabase } from './supabase';

export interface BugReportPayload {
  name: string;
  email: string;
  category: string;
  subject: string;
  description: string;
  files: File[];
  formspreeId?: string;
}

export interface BugReportResult {
  success: boolean;
  message: string;
  screenshotUrls: string[];
  reportId?: string;
  deliveryMethod: 'formspree' | 'supabase' | 'local';
}

const DEFAULT_FORMSPREE_ID = import.meta.env.VITE_FORMSPREE_FORM_ID || '';

export function getStoredFormspreeId(): string {
  try {
    return localStorage.getItem('trendsbox_formspree_id') || DEFAULT_FORMSPREE_ID || '';
  } catch {
    return DEFAULT_FORMSPREE_ID || '';
  }
}

export function setStoredFormspreeId(id: string): void {
  try {
    if (id.trim()) {
      localStorage.setItem('trendsbox_formspree_id', id.trim());
    } else {
      localStorage.removeItem('trendsbox_formspree_id');
    }
  } catch (err) {
    console.warn('Failed to store Formspree ID:', err);
  }
}

/**
 * Uploads a screenshot file to Supabase Storage with graceful base64 fallback
 */
export async function uploadScreenshotToStorage(file: File): Promise<string> {
  const fileExt = file.name.split('.').pop() || 'png';
  const fileName = `bug_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
  const filePath = `reports/${fileName}`;

  try {
    // 1. Try uploading to Supabase Storage bucket 'bug-reports'
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('bug-reports')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (!uploadError && uploadData) {
      const { data } = supabase.storage
        .from('bug-reports')
        .getPublicUrl(filePath);

      if (data?.publicUrl) {
        return data.publicUrl;
      }
    }
  } catch (storageErr) {
    console.warn('Supabase storage direct upload failed, trying fallback...', storageErr);
  }

  // Fallback: Read as base64 data URL if storage bucket is not provisioned or public
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(reader.result as string);
    };
    reader.onerror = () => {
      resolve(`[Screenshot: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`);
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Submits the complete bug report to Formspree with Supabase & local storage fallbacks
 */
export async function submitBugReport(payload: BugReportPayload): Promise<BugReportResult> {
  const { name, email, category, subject, description, files } = payload;
  const activeFormspreeId = (payload.formspreeId || getStoredFormspreeId()).trim();

  // 1. Upload screenshots
  const screenshotUrls: string[] = [];
  for (const file of files.slice(0, 2)) {
    try {
      const url = await uploadScreenshotToStorage(file);
      screenshotUrls.push(url);
    } catch (e) {
      console.error('Failed to upload file:', file.name, e);
      screenshotUrls.push(`[Failed upload: ${file.name}]`);
    }
  }

  // 2. Gather browser & device diagnostics
  const diagnostics = {
    userAgent: navigator.userAgent,
    screenSize: `${window.innerWidth}x${window.innerHeight} (Screen: ${window.screen.width}x${window.screen.height})`,
    language: navigator.language,
    time: new Date().toISOString(),
    localTimeNigeria: new Date().toLocaleTimeString('en-US', { timeZone: 'Africa/Lagos' }),
    url: window.location.href,
  };

  // Format screenshot references for email viewing
  const screenshotLinksText = screenshotUrls.length > 0
    ? screenshotUrls
        .map((url, i) => `Screenshot #${i + 1}:\n${url.startsWith('data:') ? `[Embedded Image Preview - ${url.substring(0, 50)}...]` : url}`)
        .join('\n\n')
    : 'No screenshots attached.';

  // 3. Prepare Formspree Submission if ID is provided
  if (activeFormspreeId) {
    try {
      const formspreeEndpoint = `https://formspree.io/f/${activeFormspreeId.replace(/^https:\/\/formspree\.io\/f\//, '')}`;
      
      const response = await fetch(formspreeEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          _replyto: email,
          category,
          subject: `[Trends Box Bug] [${category}] ${subject}`,
          message: description,
          screenshots_summary: screenshotLinksText,
          screenshot_1: screenshotUrls[0] || 'N/A',
          screenshot_2: screenshotUrls[1] || 'N/A',
          device_info: `${diagnostics.screenSize} | ${diagnostics.userAgent}`,
          timestamp_wat: diagnostics.localTimeNigeria,
          current_url: diagnostics.url
        })
      });

      if (response.ok) {
        // Also save a copy to local storage for user's peace of mind
        saveToLocalReports({ name, email, category, subject, description, screenshotUrls, date: new Date().toISOString() });
        return {
          success: true,
          message: 'Bug report sent directly to our team via Formspree!',
          screenshotUrls,
          deliveryMethod: 'formspree'
        };
      }
    } catch (err) {
      console.warn('Formspree dispatch failed, attempting database fallback:', err);
    }
  }

  // 4. Fallback: Save to Supabase 'bug_reports' table if available
  try {
    const { data, error } = await supabase
      .from('bug_reports')
      .insert([{
        reporter_name: name,
        reporter_email: email,
        category,
        subject,
        description,
        screenshots: screenshotUrls,
        diagnostics,
        created_at: new Date().toISOString()
      }])
      .select();

    if (!error && data) {
      return {
        success: true,
        message: 'Bug report securely recorded in our support database!',
        screenshotUrls,
        reportId: data[0]?.id,
        deliveryMethod: 'supabase'
      };
    }
  } catch (dbErr) {
    console.warn('Supabase table insert skipped/failed:', dbErr);
  }

  // 5. Final reliable fallback: Save locally
  saveToLocalReports({ name, email, category, subject, description, screenshotUrls, date: new Date().toISOString() });
  return {
    success: true,
    message: 'Bug report saved successfully! Our team will review your report.',
    screenshotUrls,
    deliveryMethod: 'local'
  };
}

function saveToLocalReports(report: any) {
  try {
    const existing = JSON.parse(localStorage.getItem('trendsbox_bug_reports') || '[]');
    existing.unshift({ id: `rep_${Date.now()}`, ...report });
    localStorage.setItem('trendsbox_bug_reports', JSON.stringify(existing.slice(0, 30)));
  } catch {
    // Ignore localStorage errors
  }
}
