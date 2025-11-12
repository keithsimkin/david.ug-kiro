import { ListingPerformance } from '@shared/types/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ListingPerformanceTableProps {
  listings: ListingPerformance[];
}

export function ListingPerformanceTable({ listings }: ListingPerformanceTableProps) {
  if (!listings || listings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Listings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">No listings data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Performing Listings</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Listing</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Views</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Contacts</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Saves</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Conv. Rate</th>
              </tr>
            </thead>
            <tbody>
              {listings.map((listing) => (
                <tr key={listing.listingId} className="border-b last:border-0 hover:bg-muted/50">
                  <td className="py-3 px-2">
                    <div className="font-medium text-sm">{listing.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(listing.createdAt).toLocaleDateString()}
                    </div>
                  </td>
                  <td className="text-right py-3 px-2 text-sm">{listing.views}</td>
                  <td className="text-right py-3 px-2 text-sm">{listing.contacts}</td>
                  <td className="text-right py-3 px-2 text-sm">{listing.saves}</td>
                  <td className="text-right py-3 px-2 text-sm font-medium">
                    {listing.conversionRate.toFixed(1)}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
