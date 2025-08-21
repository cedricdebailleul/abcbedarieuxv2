"use client";

import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  Upload,
  FileText, 
  Image as ImageIcon, 
  Download,
  AlertTriangle,
  Paperclip,
  Trash2
} from "lucide-react";
import { useDropzone } from "react-dropzone";

export interface Attachment {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  file?: File;
  uploading?: boolean;
  uploaded?: boolean;
  error?: string;
}

interface AttachmentManagerProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  maxTotalSize?: number; // en MB
  maxFiles?: number;
  acceptedTypes?: string[];
}

export function AttachmentManager({
  attachments,
  onAttachmentsChange,
  maxTotalSize = 15,
  maxFiles = 10}: AttachmentManagerProps) {
  const [dragActive, setDragActive] = useState(false);

  const totalSize = attachments.reduce((total, att) => total + att.size, 0);
  const totalSizeMB = totalSize / (1024 * 1024);
  
  const uploadFile = async (attachment: Attachment) => {
    const formData = new FormData();
    formData.append('files', attachment.file!);

    try {
      const response = await fetch('/api/admin/newsletter/attachments/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      const result = await response.json();
      
      if (result.success && result.files.length > 0) {
        const uploadedFile = result.files[0];
        return {
          ...attachment,
          url: uploadedFile.url,
          uploaded: true,
          uploading: false,
          error: undefined
        };
      } else {
        return {
          ...attachment,
          uploading: false,
          error: result.error || 'Erreur d\'upload'
        };
      }
    } catch {
      return {
        ...attachment,
        uploading: false,
        error: 'Erreur réseau'
      };
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const newAttachments: Attachment[] = [];
    let currentSize = totalSize;
    
    for (const file of acceptedFiles) {
      if (attachments.length + newAttachments.length >= maxFiles) {
        break;
      }
      
      if ((currentSize + file.size) > (maxTotalSize * 1024 * 1024)) {
        // Fichier trop volumineux, on l'ajoute avec une erreur
        newAttachments.push({
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          size: file.size,
          type: file.type,
          file,
          error: `Dépasse la limite de ${maxTotalSize}MB au total`
        });
        break;
      }
      
      const attachment: Attachment = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
        file,
        uploading: true,
        uploaded: false
      };
      
      newAttachments.push(attachment);
      currentSize += file.size;
    }
    
    // Ajouter les fichiers avec statut "uploading"
    const updatedAttachments = [...attachments, ...newAttachments];
    onAttachmentsChange(updatedAttachments);

    // Uploader chaque fichier
    for (let i = 0; i < newAttachments.length; i++) {
      const attachment = newAttachments[i];
      if (!attachment.error && attachment.file) {
        const uploadedAttachment = await uploadFile(attachment);
        
        // Mettre à jour le fichier spécifique
        const currentAttachments = [...updatedAttachments];
        const index = currentAttachments.findIndex(a => a.id === attachment.id);
        if (index !== -1) {
          currentAttachments[index] = uploadedAttachment;
          onAttachmentsChange(currentAttachments);
        }
      }
    }
  }, [attachments, maxFiles, maxTotalSize, totalSize, onAttachmentsChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']
    },
    maxFiles: maxFiles - attachments.length,
    onDragEnter: () => setDragActive(true),
    onDragLeave: () => setDragActive(false),
    onDropAccepted: () => setDragActive(false),
    onDropRejected: () => setDragActive(false)
  });

  const removeAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter(att => att.id !== id));
  };

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return <FileText className="w-5 h-5 text-red-500" />;
    if (type.includes('image')) return <ImageIcon className="w-5 h-5 text-blue-500" />;
    return <Paperclip className="w-5 h-5 text-gray-500" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const canAddMoreFiles = attachments.length < maxFiles && totalSizeMB < maxTotalSize;
  const progressPercentage = Math.min((totalSizeMB / maxTotalSize) * 100, 100);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Paperclip className="w-5 h-5" />
          Pièces jointes
          {attachments.length > 0 && (
            <Badge variant="secondary">
              {attachments.length} fichier{attachments.length > 1 ? 's' : ''}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Zone de drop */}
        {canAddMoreFiles && (
          <div
            {...getRootProps()}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
              ${isDragActive || dragActive 
                ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20' 
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <input {...getInputProps()} />
            <Upload className={`w-8 h-8 mx-auto mb-4 ${
              isDragActive || dragActive ? 'text-blue-500' : 'text-gray-400'
            }`} />
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {isDragActive 
                ? 'Déposez vos fichiers ici...' 
                : 'Glissez-déposez vos fichiers ou cliquez pour sélectionner'
              }
            </p>
            <p className="text-xs text-gray-500">
              PDF, Images (JPG, PNG, GIF, WebP) • Max {maxFiles} fichiers • {maxTotalSize}MB au total
            </p>
          </div>
        )}

        {/* Barre de progression de l'espace utilisé */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Espace utilisé</span>
            <span className={`font-medium ${
              totalSizeMB > maxTotalSize * 0.8 ? 'text-red-600' : 'text-gray-900'
            }`}>
              {totalSizeMB.toFixed(1)} MB / {maxTotalSize} MB
            </span>
          </div>
          <Progress 
            value={progressPercentage} 
            className={`h-2 ${progressPercentage >= 100 ? 'bg-red-100' : ''}`}
          />
          {totalSizeMB > maxTotalSize && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                La taille totale des pièces jointes dépasse la limite de {maxTotalSize}MB. 
                Veuillez supprimer des fichiers.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Liste des fichiers */}
        {attachments.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-gray-700">Fichiers ajoutés</h4>
            {attachments.map((attachment) => (
              <div 
                key={attachment.id}
                className={`flex items-center gap-3 p-3 border rounded-lg ${
                  attachment.error 
                    ? 'border-red-200 bg-red-50' 
                    : attachment.uploaded 
                    ? 'border-green-200 bg-green-50'
                    : 'border-gray-200'
                }`}
              >
                {getFileIcon(attachment.type)}
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {attachment.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatFileSize(attachment.size)} • {attachment.type}
                      </p>
                      {attachment.error && (
                        <p className="text-xs text-red-600 mt-1">
                          {attachment.error}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {attachment.uploading && (
                        <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                      )}
                      
                      {attachment.uploaded && (
                        <Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
                          Envoyé
                        </Badge>
                      )}
                      
                      {attachment.error && (
                        <Badge variant="destructive" className="text-xs">
                          Erreur
                        </Badge>
                      )}
                      
                      {attachment.url && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(attachment.url, '_blank')}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeAttachment(attachment.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Avertissements */}
        {attachments.length >= maxFiles && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Limite atteinte : maximum {maxFiles} fichiers autorisés.
            </AlertDescription>
          </Alert>
        )}

        {attachments.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-4">
            Aucune pièce jointe ajoutée
          </div>
        )}
      </CardContent>
    </Card>
  );
}