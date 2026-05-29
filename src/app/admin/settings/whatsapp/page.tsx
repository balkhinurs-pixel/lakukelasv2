import { createClient } from '@/lib/supabase/server';
import WhatsAppSettingsClient from './whatsapp-settings-client';

export default async function WhatsAppSettingsPage() {
    const supabase = await createClient();
    
    // Fetch all relevant settings
    const { data: settingsData } = await supabase
        .from('settings')
        .select('key, value')
        .in('key', ['fonnte_api_token', 'wa_reminder_enabled', 'wa_reminder_time', 'app_url']);

    const settings = {
        token: settingsData?.find(s => s.key === 'fonnte_api_token')?.value || '',
        enabled: settingsData?.find(s => s.key === 'wa_reminder_enabled')?.value === 'true',
        time: settingsData?.find(s => s.key === 'wa_reminder_time')?.value || '06:00',
        appUrl: settingsData?.find(s => s.key === 'app_url')?.value || 'https://app.lakukelas.my.id'
    };

    return <WhatsAppSettingsClient initialSettings={settings} />;
}
