"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Database,
  Trash2,
  RotateCcw,
  Home,
  AlertTriangle,
  CheckCircle,
  FileText,
  Brain,
  Target,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import {
  useClearAllData,
  useResetAllData,
  useDeleteTopicData,
  useResetTopicData,
  useQuestionCount,
  useAllReadingMaterials,
  useGetQuizProgress,
} from "@/lib/queries";

const TOPICS = [
  "Manajemen Inventori",
  "Pengadaan Medis", 
  "SOP Logistik",
  "Distribusi Obat",
  "Keselamatan Pasien",
  "Regulasi Kesehatan",
];

export default function DataManagementPage() {
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    type: 'clear-all' | 'reset-all' | 'delete-topic' | 'reset-topic';
    title: string;
    description: string;
  }>({
    open: false,
    type: 'clear-all',
    title: '',
    description: ''
  });

  // Queries
  const clearAllDataMutation = useClearAllData();
  const resetAllDataMutation = useResetAllData();
  const deleteTopicDataMutation = useDeleteTopicData();
  const resetTopicDataMutation = useResetTopicData();
  
  const { data: questionCount = 0 } = useQuestionCount(selectedTopic || TOPICS[0]);
  const { data: readingMaterials = [] } = useAllReadingMaterials();
  const { data: quizProgress } = useGetQuizProgress(selectedTopic || TOPICS[0]);

  const handleClearAllData = () => {
    setConfirmDialog({
      open: true,
      type: 'clear-all',
      title: 'Hapus Semua Data',
      description: 'Tindakan ini akan menghapus SEMUA data termasuk soal, materi bacaan, progress kuis, dan riwayat pembelajaran. Data yang dihapus tidak dapat dikembalikan.'
    });
  };

  const handleResetAllData = () => {
    setConfirmDialog({
      open: true,
      type: 'reset-all',
      title: 'Reset Semua Data',
      description: 'Tindakan ini akan mereset SEMUA progress dan riwayat pembelajaran, tetapi tetap mempertahankan soal dan materi bacaan. Progress yang direset tidak dapat dikembalikan.'
    });
  };

  const handleDeleteTopicData = () => {
    if (!selectedTopic) {
      toast.error("Pilih topik terlebih dahulu");
      return;
    }
    setConfirmDialog({
      open: true,
      type: 'delete-topic',
      title: `Hapus Data Topik: ${selectedTopic}`,
      description: `Tindakan ini akan menghapus SEMUA data untuk topik "${selectedTopic}" termasuk soal, materi bacaan, dan progress. Data yang dihapus tidak dapat dikembalikan.`
    });
  };

  const handleResetTopicData = () => {
    if (!selectedTopic) {
      toast.error("Pilih topik terlebih dahulu");
      return;
    }
    setConfirmDialog({
      open: true,
      type: 'reset-topic',
      title: `Reset Progress Topik: ${selectedTopic}`,
      description: `Tindakan ini akan mereset progress dan riwayat pembelajaran untuk topik "${selectedTopic}", tetapi tetap mempertahankan soal dan materi bacaan.`
    });
  };

  const executeAction = async () => {
    try {
      switch (confirmDialog.type) {
        case 'clear-all':
          await clearAllDataMutation.mutateAsync();
          toast.success("Semua data berhasil dihapus");
          break;
        case 'reset-all':
          await resetAllDataMutation.mutateAsync();
          toast.success("Semua data berhasil direset");
          break;
        case 'delete-topic':
          await deleteTopicDataMutation.mutateAsync(selectedTopic);
          toast.success(`Data topik "${selectedTopic}" berhasil dihapus`);
          break;
        case 'reset-topic':
          await resetTopicDataMutation.mutateAsync(selectedTopic);
          toast.success(`Progress topik "${selectedTopic}" berhasil direset`);
          break;
      }
    } catch (error) {
      toast.error("Terjadi kesalahan saat memproses permintaan");
      console.error(error);
    } finally {
      setConfirmDialog(prev => ({ ...prev, open: false }));
    }
  };

  const isLoading = clearAllDataMutation.isPending || 
                   resetAllDataMutation.isPending || 
                   deleteTopicDataMutation.isPending || 
                   resetTopicDataMutation.isPending;

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50">
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="flex items-center space-x-2">
            <Home className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="font-semibold text-sm sm:text-base">Kembali ke Beranda</span>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 sm:py-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <div className="w-16 h-16 sm:w-20 sm:h-20 bg-gradient-to-br from-red-600 to-orange-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Database className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Manajemen Data
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-600 mb-8">
              Kelola dan reset data pembelajaran Anda
            </p>
          </div>

          {/* Data Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Brain className="w-5 h-5 text-blue-600" />
                  <span>Bank Soal</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {questionCount}
                </div>
                <p className="text-sm text-gray-600">Soal tersimpan</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <FileText className="w-5 h-5 text-green-600" />
                  <span>Materi Bacaan</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600 mb-1">
                  {readingMaterials.length}
                </div>
                <p className="text-sm text-gray-600">Materi tersimpan</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center space-x-2 text-lg">
                  <Target className="w-5 h-5 text-purple-600" />
                  <span>Progress Kuis</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {quizProgress ? 1 : 0}
                </div>
                <p className="text-sm text-gray-600">Sesi tersimpan</p>
              </CardContent>
            </Card>
          </div>

          {/* Global Actions */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <span>Aksi Global</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <h3 className="font-semibold text-red-800 mb-2">Hapus Semua Data</h3>
                  <p className="text-sm text-red-700 mb-4">
                    Menghapus semua soal, materi bacaan, progress, dan riwayat pembelajaran.
                  </p>
                  <Button
                    variant="destructive"
                    onClick={handleClearAllData}
                    disabled={isLoading}
                    className="w-full"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus Semua
                  </Button>
                </div>

                <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                  <h3 className="font-semibold text-orange-800 mb-2">Reset Progress</h3>
                  <p className="text-sm text-orange-700 mb-4">
                    Mereset progress dan riwayat, tetapi mempertahankan soal dan materi.
                  </p>
                  <Button
                    variant="outline"
                    onClick={handleResetAllData}
                    disabled={isLoading}
                    className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Progress
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Topic-specific Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Target className="w-5 h-5 text-blue-600" />
                <span>Aksi Per Topik</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pilih Topik
                </label>
                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih topik untuk dikelola" />
                  </SelectTrigger>
                  <SelectContent>
                    {TOPICS.map((topic) => (
                      <SelectItem key={topic} value={topic}>
                        {topic}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedTopic && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                    <h3 className="font-semibold text-red-800 mb-2">Hapus Data Topik</h3>
                    <p className="text-sm text-red-700 mb-4">
                      Menghapus semua data untuk topik "{selectedTopic}".
                    </p>
                    <Button
                      variant="destructive"
                      onClick={handleDeleteTopicData}
                      disabled={isLoading}
                      className="w-full"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Hapus Topik
                    </Button>
                  </div>

                  <div className="p-4 border border-orange-200 rounded-lg bg-orange-50">
                    <h3 className="font-semibold text-orange-800 mb-2">Reset Progress Topik</h3>
                    <p className="text-sm text-orange-700 mb-4">
                      Mereset progress untuk topik "{selectedTopic}".
                    </p>
                    <Button
                      variant="outline"
                      onClick={handleResetTopicData}
                      disabled={isLoading}
                      className="w-full border-orange-300 text-orange-700 hover:bg-orange-100"
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset Progress
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span>{confirmDialog.title}</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Batal</AlertDialogCancel>
            <AlertDialogAction
              onClick={executeAction}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? "Memproses..." : "Ya, Lanjutkan"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}