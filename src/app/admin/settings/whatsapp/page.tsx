import { createClient } from '@/lib/supabase/server';
import WhatsAppSettingsClient from './whatsapp-settings-client';

export default async function WhatsAppSettingsPage() {
    const supabase = createClient();
    
    const { data: settings } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'fonnte_api_token')
        .single();

    return <WhatsAppSettingsClient initialToken={settings?.value || ''} />;
}
