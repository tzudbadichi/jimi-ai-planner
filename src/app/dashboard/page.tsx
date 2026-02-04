import { db } from '@/lib/db'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'

export default async function DashboardPage() {
  const tracks = await db.track.findMany()

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Your Life Tracks</h1>
      
      {tracks.length === 0 ? (
        <p>No tracks found. Go back and add some info.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {tracks.map((track: any) => (
            <Card key={track.id}>
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {track.title}
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                    {track.type}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-2">{track.description}</p>
                <div className="text-xs font-mono bg-slate-50 p-2 rounded">
                  Goals: {track.goals}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

