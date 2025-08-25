'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Calendar, Clock, AlertTriangle, RefreshCw } from 'lucide-react';
import { getAllSchedules } from '@/lib/data';
import type { ScheduleItem } from '@/lib/types';

export default function ScheduleDiagnostic() {
    const [diagnostic, setDiagnostic] = React.useState<any>(null);
    const [allSchedules, setAllSchedules] = React.useState<ScheduleItem[]>([]);
    const [loading, setLoading] = React.useState(false);

    const runDiagnostic = async () => {
        setLoading(true);
        try {
            const now = new Date();
            const dayViaDateFns = format(now, 'eeee', { locale: id });
            const dayViaIntl = now.toLocaleDateString('id-ID', { weekday: 'long' });
            const dayViaJS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'][now.getDay()];
            
            const schedules = await getAllSchedules();
            setAllSchedules(schedules);
            
            const uniqueDays = [...new Set(schedules.map(s => s.day))];
            
            setDiagnostic({
                currentDate: now.toISOString(),
                userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                dayDetection: {
                    dateFns: dayViaDateFns,
                    intl: dayViaIntl,
                    javascript: dayViaJS
                },
                schedulesInDatabase: schedules.length,
                uniqueDaysInDB: uniqueDays,
                matchesToday: {
                    dateFns: schedules.filter(s => s.day === dayViaDateFns).length,
                    intl: schedules.filter(s => s.day === dayViaIntl).length,
                    javascript: schedules.filter(s => s.day === dayViaJS).length
                }
            });
        } catch (error) {
            console.error('Diagnostic error:', error);
        }
        setLoading(false);
    };

    React.useEffect(() => {
        runDiagnostic();
    }, []);

    if (!diagnostic) {
        return (
            <Card>
                <CardContent className="p-6">
                    <div className="text-center">
                        <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
                        <p>Menjalankan diagnostik...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5" />
                        Diagnostik Jadwal
                    </CardTitle>
                    <CardDescription>
                        Informasi untuk membantu debugging masalah jadwal tidak muncul
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                        <div>
                            <h4 className="font-semibold mb-2">Informasi Waktu</h4>
                            <div className="space-y-1 text-sm">
                                <p><strong>Tanggal:</strong> {diagnostic.currentDate}</p>
                                <p><strong>Timezone:</strong> {diagnostic.userTimezone}</p>
                            </div>
                        </div>
                        
                        <div>
                            <h4 className="font-semibold mb-2">Deteksi Hari</h4>
                            <div className="space-y-1 text-sm">
                                <p><strong>date-fns:</strong> <Badge variant="outline">{diagnostic.dayDetection.dateFns}</Badge></p>
                                <p><strong>Intl:</strong> <Badge variant="outline">{diagnostic.dayDetection.intl}</Badge></p>
                                <p><strong>JavaScript:</strong> <Badge variant="outline">{diagnostic.dayDetection.javascript}</Badge></p>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-semibold mb-2">Database Info</h4>
                        <div className="space-y-1 text-sm">
                            <p><strong>Total Jadwal:</strong> {diagnostic.schedulesInDatabase}</p>
                            <p><strong>Hari di Database:</strong> {diagnostic.uniqueDaysInDB.join(', ')}</p>
                        </div>
                    </div>
                    
                    <div>
                        <h4 className="font-semibold mb-2">Pencocokan Hari Ini</h4>
                        <div className="space-y-1 text-sm">
                            <p><strong>Dengan date-fns:</strong> {diagnostic.matchesToday.dateFns} jadwal</p>
                            <p><strong>Dengan Intl:</strong> {diagnostic.matchesToday.intl} jadwal</p>
                            <p><strong>Dengan JavaScript:</strong> {diagnostic.matchesToday.javascript} jadwal</p>
                        </div>
                    </div>
                    
                    {diagnostic.schedulesInDatabase === 0 && (
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Tidak ada jadwal di database.</strong> Pastikan jadwal sudah diinput oleh admin melalui halaman pengaturan jadwal.
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    {diagnostic.schedulesInDatabase > 0 && Object.values(diagnostic.matchesToday).every((count: any) => count === 0) && (
                        <Alert>
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                <strong>Jadwal ada di database tapi tidak cocok dengan hari ini.</strong> 
                                Kemungkinan ada masalah dalam format nama hari atau timezone.
                            </AlertDescription>
                        </Alert>
                    )}
                    
                    <Button onClick={runDiagnostic} disabled={loading} className="w-full">
                        <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                        Jalankan Ulang Diagnostik
                    </Button>
                </CardContent>
            </Card>
            
            {allSchedules.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Semua Jadwal di Database</CardTitle>
                        <CardDescription>Daftar lengkap jadwal untuk debugging</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-2 max-h-60 overflow-y-auto">
                            {allSchedules.map((schedule, index) => (
                                <div key={schedule.id} className="flex justify-between items-center p-2 bg-muted rounded text-sm">
                                    <div>
                                        <strong>{schedule.day}</strong> - {schedule.subject} ({schedule.class})
                                    </div>
                                    <div className="text-muted-foreground">
                                        {schedule.start_time} - {schedule.end_time}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}