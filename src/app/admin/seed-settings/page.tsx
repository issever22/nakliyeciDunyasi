"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { seedInitialSettings } from './actions';
import { Loader2, CheckCircle, XCircle, Info } from 'lucide-react';

interface SeedResultDetail {
  category?: string;
  name?: string;
  status: string;
}

export default function SeedSettingsPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<SeedResultDetail[]>([]);
  const [message, setMessage] = useState('');
  const [overallSuccess, setOverallSuccess] = useState<boolean | null>(null);

  const handleSeedData = async () => {
    setIsLoading(true);
    setMessage('');
    setResults([]);
    setOverallSuccess(null);
    try {
      const response = await seedInitialSettings();
      setMessage(response.message);
      setResults(response.details || []);
      setOverallSuccess(response.success);
    } catch (error: any) {
      setMessage(`Beklenmedik bir hata oluştu: ${error.message}`);
      setOverallSuccess(false);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    if (status.includes('Başarıyla eklendi')) return <CheckCircle className="inline mr-1 h-4 w-4 text-green-500" />;
    if (status.includes('Zaten mevcut')) return <Info className="inline mr-1 h-4 w-4 text-blue-500" />;
    if (status.includes('Hata') || status.includes('hatası')) return <XCircle className="inline mr-1 h-4 w-4 text-red-500" />;
    return null;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-muted/20 p-4">
      <Card className="w-full max-w-xl shadow-xl border">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">Başlangıç Ayarlarını Yükle</CardTitle>
          <CardDescription>
            Bu araç, Araç Tipleri ve Yük Cinsleri için başlangıç verilerini
            uygulama sabitlerinden Firestore'a tek seferlik yükler.
            Aynı isimde mevcut olan kayıtlar atlanacaktır.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Button 
            onClick={handleSeedData} 
            disabled={isLoading} 
            className="w-full bg-primary hover:bg-primary/90 text-lg py-3"
          >
            {isLoading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
            {isLoading ? 'Veriler Yükleniyor...' : 'Başlangıç Verilerini Firestore\'a Yükle'}
          </Button>
          
          {message && (
            <div className={`mt-4 p-4 rounded-md text-sm flex items-center gap-2 ${
              overallSuccess === null ? 'bg-blue-50 text-blue-700 border border-blue-300' : 
              overallSuccess ? 'bg-green-50 text-green-700 border border-green-300' : 
              'bg-red-50 text-red-700 border border-red-300'
            }`}>
              {overallSuccess === null ? <Info size={20}/> : overallSuccess ? <CheckCircle size={20} /> : <XCircle size={20} />}
              <p><strong>Durum:</strong> {message}</p>
            </div>
          )}

          {results.length > 0 && (
            <div className="mt-4 p-4 border rounded-md max-h-[300px] overflow-y-auto bg-background shadow-inner">
              <h4 className="text-md font-semibold mb-3 text-foreground border-b pb-2">Yükleme Günlüğü:</h4>
              <ul className="space-y-1.5 text-sm">
                {results.map((result, index) => (
                  <li key={index} className="flex items-center">
                    {getStatusIcon(result.status)}
                    {result.category && <span className="font-semibold text-muted-foreground">{result.category}: </span>}
                    {result.name && <span className="ml-1 font-medium text-foreground">{result.name}</span>}
                    <span className="ml-1 text-muted-foreground">-</span>
                    <span className={`ml-1 ${result.status?.includes('Hata') || result.status?.includes('hatası') ? 'text-red-600 font-medium' : (result.status?.includes('Başarıyla eklendi') ? 'text-green-600' : 'text-gray-600')}`}>
                      {result.status}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground text-center w-full">
            Bu işlem için Firestore yazma izinlerinizin olduğundan emin olun. 
            Yükleme sonrası bu sayfayı ve ilgili eylemi kaldırabilirsiniz.
            Bu sayfa admin menüsüne otomatik eklenmemiştir.
            </p>
        </CardFooter>
      </Card>
    </div>
  );
}
