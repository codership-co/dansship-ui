import { Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from 'dansship-ui';

export function Default() {
  return (
    <Card style={{ width: 320 }}>
      <CardHeader>
        <CardTitle>Monthly Unlimited</CardTitle>
        <CardDescription>Unlimited classes, billed monthly.</CardDescription>
      </CardHeader>
      <CardContent>
        <p style={{ margin: 0 }}>$89.00 / month</p>
      </CardContent>
      <CardFooter>
        <Button style={{ width: '100%' }}>Select plan</Button>
      </CardFooter>
    </Card>
  );
}

export function WithBadge() {
  return (
    <Card style={{ width: 320 }}>
      <CardHeader>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <CardTitle>Active subscription</CardTitle>
          <Badge>active</Badge>
        </div>
        <CardDescription>Renews on Sep 1, 2026</CardDescription>
      </CardHeader>
      <CardContent>
        <p style={{ margin: 0 }}>10-Class Pack — 6 classes remaining</p>
      </CardContent>
    </Card>
  );
}
