import { Button, Popover, PopoverContent, PopoverTrigger } from 'dansship-ui';

export function Default() {
  return (
    <Popover open>
      <PopoverTrigger asChild>
        <Button variant='outline'>Filters</Button>
      </PopoverTrigger>
      <PopoverContent style={{ width: 240 }}>
        <p style={{ margin: 0, fontWeight: 600 }}>Filter classes</p>
        <p style={{ margin: '8px 0 0', fontSize: 13 }}>Choose a style and instructor to narrow results.</p>
      </PopoverContent>
    </Popover>
  );
}
