import { Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from 'dansship-ui';

const plans = [
  { id: 1, name: 'Monthly Unlimited', price: '$89.00', classes: 'Unlimited', status: 'active' },
  { id: 2, name: '10-Class Pack', price: '$120.00', classes: '10', status: 'active' },
  { id: 3, name: 'Drop-in', price: '$18.00', classes: '1', status: 'inactive' },
];

export function Default() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Classes</TableHead>
          <TableHead className='text-right'>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {plans.map((plan) => (
          <TableRow key={plan.id}>
            <TableCell className='font-medium'>{plan.name}</TableCell>
            <TableCell>{plan.price}</TableCell>
            <TableCell>{plan.classes}</TableCell>
            <TableCell className='text-right'>
              <Badge variant={plan.status === 'active' ? 'default' : 'outline'}>{plan.status}</Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export function Empty() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Name</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>Classes</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableCell colSpan={3} className='text-center py-4 text-gray-500'>
            No plans found.
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}
