import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { PlaylistMetadata as PlaylistMetadataType } from "@/types";

interface PlaylistMetadataProps {
  metadata?: PlaylistMetadataType;
  className?: string;
}

export default function PlaylistMetadata({ metadata, className }: PlaylistMetadataProps) {
  if (!metadata) {
    return null;
  }

  const hasMetadata = metadata.primary_genre || metadata.mood || metadata.energy_level || 
                     metadata.dominant_instruments?.length || metadata.themes?.length;

  if (!hasMetadata) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-gray-700">
          📊 Categorização
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Gênero */}
        {metadata.primary_genre && (
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">Gênero</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="text-xs">
                {metadata.primary_genre}
              </Badge>
              {metadata.subgenre && (
                <Badge variant="outline" className="text-xs">
                  {metadata.subgenre}
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* Humor */}
        {metadata.mood && (
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">Humor</h4>
            <Badge variant="secondary" className="text-xs">
              {metadata.mood}
            </Badge>
          </div>
        )}

        {/* Energia */}
        {metadata.energy_level && (
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">Energia</h4>
            <Badge variant="secondary" className="text-xs">
              {metadata.energy_level}
            </Badge>
          </div>
        )}

        {/* Tempo */}
        {metadata.tempo && (
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">Tempo</h4>
            <Badge variant="outline" className="text-xs">
              {metadata.tempo}
            </Badge>
          </div>
        )}

        {/* Instrumentos */}
        {metadata.dominant_instruments && metadata.dominant_instruments.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">Instrumentos</h4>
            <div className="flex flex-wrap gap-1">
              {metadata.dominant_instruments.map((instrument, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {instrument}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Temas */}
        {metadata.themes && metadata.themes.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">Temas</h4>
            <div className="flex flex-wrap gap-1">
              {metadata.themes.map((theme, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {theme}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Época/Anos */}
        {metadata.years && metadata.years.length > 0 && (
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">Época</h4>
            <div className="flex flex-wrap gap-1">
              {metadata.years.map((year, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  {year}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Estilo Vocal */}
        {metadata.vocal_style && (
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-2">Estilo Vocal</h4>
            <Badge variant="outline" className="text-xs">
              {metadata.vocal_style}
            </Badge>
          </div>
        )}

        {/* Metadados Adicionais */}
        {(metadata.bpm_range || metadata.key_signature || metadata.language || metadata.cultural_influence) && (
          <>
            <Separator />
            <div className="space-y-2">
              <h4 className="text-xs font-medium text-gray-600">Detalhes Técnicos</h4>
              <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                {metadata.bpm_range && (
                  <div>
                    <span className="font-medium">BPM:</span> {metadata.bpm_range}
                  </div>
                )}
                {metadata.key_signature && (
                  <div>
                    <span className="font-medium">Tom:</span> {metadata.key_signature}
                  </div>
                )}
                {metadata.language && (
                  <div>
                    <span className="font-medium">Idioma:</span> {metadata.language}
                  </div>
                )}
                {metadata.cultural_influence && (
                  <div className="col-span-2">
                    <span className="font-medium">Influência Cultural:</span> {metadata.cultural_influence}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
} 