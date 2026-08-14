import { Tabs, TabsContent, TabsList, TabsTrigger } from 'dansship-ui';

export function Default() {
  return (
    <Tabs defaultValue='upcoming' style={{ width: 360 }}>
      <TabsList>
        <TabsTrigger value='upcoming'>Upcoming</TabsTrigger>
        <TabsTrigger value='past'>Past</TabsTrigger>
        <TabsTrigger value='waitlisted'>Waitlisted</TabsTrigger>
      </TabsList>
      <TabsContent value='upcoming'>
        <p style={{ margin: 0, paddingTop: 12 }}>3 upcoming classes this week.</p>
      </TabsContent>
      <TabsContent value='past'>
        <p style={{ margin: 0, paddingTop: 12 }}>12 classes attended this month.</p>
      </TabsContent>
      <TabsContent value='waitlisted'>
        <p style={{ margin: 0, paddingTop: 12 }}>No waitlisted classes.</p>
      </TabsContent>
    </Tabs>
  );
}
