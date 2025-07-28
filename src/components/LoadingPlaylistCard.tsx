import { Card, CardContent } from "@/components/ui/card";

export default function LoadingPlaylistCard() {
  return (
    <Card className="animate-pulse">
      <CardContent className="p-0">
        {/* Cover placeholder */}
        <div className="aspect-square bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-lg relative overflow-hidden">
          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
          
          {/* AI Badge placeholder */}
          <div className="absolute top-2 md:top-3 right-2 md:right-3 w-8 h-4 md:w-10 md:h-5 bg-gray-300 rounded-full"></div>
          
          {/* Heart button placeholder */}
          <div className="absolute bottom-2 md:bottom-3 right-2 md:right-3 w-6 h-6 md:w-8 md:h-8 bg-gray-300 rounded-full"></div>
        </div>
        
        {/* Content placeholder */}
        <div className="p-2 md:p-3 lg:p-4 space-y-1 md:space-y-2">
          {/* Title placeholder */}
          <div className="h-3 md:h-4 bg-gray-200 rounded w-3/4"></div>
          
          {/* Metadata placeholders */}
          <div className="flex items-center gap-2 md:gap-4">
            <div className="h-2 md:h-3 bg-gray-200 rounded w-1/3"></div>
            <div className="h-2 md:h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
          
          {/* Additional metadata */}
          <div className="h-2 md:h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </CardContent>
    </Card>
  );
} 