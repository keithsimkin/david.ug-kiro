import { Card, CardContent, CardFooter } from '../ui/card';

export function ListingCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-[4/3] bg-gray-200 animate-pulse" />
      <CardContent className="p-4">
        <div className="h-6 bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-8 bg-gray-200 rounded animate-pulse w-2/3 mb-2" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2 mb-1" />
        <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3 mb-2" />
      </CardContent>
      <CardFooter className="px-4 pb-4 pt-0 flex items-center justify-between">
        <div className="h-3 bg-gray-200 rounded animate-pulse w-20" />
        <div className="h-3 bg-gray-200 rounded animate-pulse w-12" />
      </CardFooter>
    </Card>
  );
}
