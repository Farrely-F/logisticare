"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  Plus,
  Bookmark,
  BookmarkCheck,
  Trash2,
  Clock,
  Calendar,
} from "lucide-react";
import { MarkdownRenderer } from "@/components/markdown-renderer";
import {
  useGenerateReadingMaterial,
  useAllReadingMaterials,
  useBookmarkedReadingMaterials,
  useUpdateReadingMaterialLastRead,
  useToggleReadingMaterialBookmark,
  useDeleteReadingMaterial,
} from "@/lib/queries";
import { ReadingMaterial } from "@/lib/db";
import { toast } from "sonner";

const TOPICS = [
  "Manajemen Logistik Rumah Sakit",
  "Sistem Informasi Kesehatan",
  "Manajemen Persediaan Medis",
  "Distribusi Obat dan Alkes",
  "Keselamatan Pasien",
  "Manajemen Kualitas",
  "Regulasi Kesehatan",
  "Farmasi Rumah Sakit",
];

const DIFFICULTIES = [
  { value: "beginner", label: "Pemula" },
  { value: "intermediate", label: "Menengah" },
  { value: "advanced", label: "Lanjutan" },
];

export default function ReadingMaterialsPage() {
  const [selectedTopic, setSelectedTopic] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("");
  const [selectedMaterial, setSelectedMaterial] =
    useState<ReadingMaterial | null>(null);

  const generateMutation = useGenerateReadingMaterial();
  const { data: allMaterials = [], refetch: refetchAll } =
    useAllReadingMaterials();
  const { data: bookmarkedMaterials = [], refetch: refetchBookmarked } =
    useBookmarkedReadingMaterials();
  const updateLastReadMutation = useUpdateReadingMaterialLastRead();
  const toggleBookmarkMutation = useToggleReadingMaterialBookmark();
  const deleteMutation = useDeleteReadingMaterial();

  const handleGenerate = async () => {
    if (!selectedTopic || !selectedDifficulty) {
      toast.error("Pilih topik dan tingkat kesulitan terlebih dahulu");
      return;
    }

    try {
      await generateMutation.mutateAsync({
        topic: selectedTopic,
        difficulty: selectedDifficulty,
      });
      toast.success("Materi bacaan berhasil dibuat!");
      refetchAll();
    } catch (error) {
      toast.error("Gagal membuat materi bacaan");
    }
  };

  const handleReadMaterial = async (material: ReadingMaterial) => {
    setSelectedMaterial(material);
    if (material.id) {
      await updateLastReadMutation.mutateAsync(material.id);
      refetchAll();
      refetchBookmarked();
    }
  };

  const handleToggleBookmark = async (materialId: number) => {
    try {
      await toggleBookmarkMutation.mutateAsync(materialId);
      toast.success("Bookmark berhasil diubah");
      refetchAll();
      refetchBookmarked();
    } catch (error) {
      toast.error("Gagal mengubah bookmark");
    }
  };

  const handleDelete = async (materialId: number) => {
    if (confirm("Apakah Anda yakin ingin menghapus materi ini?")) {
      try {
        await deleteMutation.mutateAsync(materialId);
        toast.success("Materi berhasil dihapus");
        refetchAll();
        refetchBookmarked();
        if (selectedMaterial?.id === materialId) {
          setSelectedMaterial(null);
        }
      } catch (error) {
        toast.error("Gagal menghapus materi");
      }
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("id-ID", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const MaterialCard = ({ material }: { material: ReadingMaterial }) => (
    <Card className="cursor-pointer hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <CardTitle className="text-lg line-clamp-2">
              {material.title}
            </CardTitle>
            <CardDescription className="mt-1 flex flex-wrap gap-2">
              <Badge variant="outline" className="mr-2">
                {material.topic.substring(0, 10)}...
              </Badge>
              <Badge variant="secondary">{material.difficulty}</Badge>
            </CardDescription>
          </div>
          <div className="flex gap-1 ml-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (material.id) handleToggleBookmark(material.id);
              }}
            >
              {material.bookmarked ? (
                <BookmarkCheck className="h-4 w-4 text-yellow-500" />
              ) : (
                <Bookmark className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                if (material.id) handleDelete(material.id);
              }}
            >
              <Trash2 className="h-4 w-4 text-red-500" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
          {material.content.substring(0, 200)}...
        </p> */}
        <MarkdownRenderer
          content={material.content.substring(0, 200) + "..."}
          className="[&_*]:text-sm"
        />
        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {formatDate(material.createdAt)}
          </div>
          {material.lastRead && (
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Terakhir dibaca: {formatDate(material.lastRead)}
            </div>
          )}
        </div>
        <Button
          className="w-full mt-3"
          onClick={() => handleReadMaterial(material)}
        >
          <BookOpen className="h-4 w-4 mr-2" />
          Baca Materi
        </Button>
      </CardContent>
    </Card>
  );

  if (selectedMaterial) {
    return (
      <div className="container mx-auto p-6 max-w-4xl">
        <div className="mb-6">
          <Button
            variant="outline"
            onClick={() => setSelectedMaterial(null)}
            className="mb-4"
          >
            ← Kembali ke Daftar Materi
          </Button>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {selectedMaterial.title}
              </h1>
              <div className="flex gap-2 mb-2">
                <Badge variant="outline">{selectedMaterial.topic}</Badge>
                <Badge variant="secondary">{selectedMaterial.difficulty}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                Dibuat: {formatDate(selectedMaterial.createdAt)}
              </p>
            </div>
            <Button
              variant="ghost"
              onClick={() => {
                if (selectedMaterial.id)
                  handleToggleBookmark(selectedMaterial.id);
              }}
            >
              {selectedMaterial.bookmarked ? (
                <BookmarkCheck className="h-5 w-5 text-yellow-500" />
              ) : (
                <Bookmark className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        <Card>
          <CardContent className="p-6">
            <MarkdownRenderer content={selectedMaterial.content} />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Materi Bacaan</h1>
        <p className="text-muted-foreground">
          Buat dan kelola materi bacaan untuk memperdalam pemahaman Anda
        </p>
      </div>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Buat Materi Bacaan Baru
          </CardTitle>
          <CardDescription>
            Pilih topik dan tingkat kesulitan untuk membuat materi bacaan yang
            sesuai
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="topic">Topik</Label>
              <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih topik" />
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
            <div className="space-y-2">
              <Label htmlFor="difficulty">Tingkat Kesulitan</Label>
              <Select
                value={selectedDifficulty}
                onValueChange={setSelectedDifficulty}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Pilih tingkat kesulitan" />
                </SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((difficulty) => (
                    <SelectItem key={difficulty.value} value={difficulty.value}>
                      {difficulty.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleGenerate}
            disabled={
              generateMutation.isPending ||
              !selectedTopic ||
              !selectedDifficulty
            }
            className="w-full"
          >
            {generateMutation.isPending
              ? "Membuat Materi..."
              : "Buat Materi Bacaan"}
          </Button>
        </CardContent>
      </Card>

      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="all">
            Semua Materi ({allMaterials.length})
          </TabsTrigger>
          <TabsTrigger value="bookmarked">
            Tersimpan ({bookmarkedMaterials.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {allMaterials.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Belum ada materi bacaan
                </h3>
                <p className="text-muted-foreground text-center">
                  Buat materi bacaan pertama Anda dengan memilih topik dan
                  tingkat kesulitan di atas
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {allMaterials.map((material) => (
                <MaterialCard key={material.id} material={material} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="bookmarked" className="space-y-4">
          {bookmarkedMaterials.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bookmark className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  Belum ada materi tersimpan
                </h3>
                <p className="text-muted-foreground text-center">
                  Simpan materi bacaan favorit Anda dengan mengklik ikon
                  bookmark
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bookmarkedMaterials.map((material) => (
                <MaterialCard key={material.id} material={material} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
