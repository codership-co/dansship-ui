import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from 'dansship-ui';

export function Default() {
  return (
    <Select defaultValue='hip-hop'>
      <SelectTrigger style={{ width: 240 }}>
        <SelectValue placeholder='Select a dance style' />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='hip-hop'>Hip-Hop</SelectItem>
        <SelectItem value='contemporary'>Contemporary</SelectItem>
        <SelectItem value='ballet'>Ballet</SelectItem>
        <SelectItem value='salsa'>Salsa</SelectItem>
      </SelectContent>
    </Select>
  );
}

export function Disabled() {
  return (
    <Select disabled defaultValue='hip-hop'>
      <SelectTrigger style={{ width: 240 }}>
        <SelectValue placeholder='Select a dance style' />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='hip-hop'>Hip-Hop</SelectItem>
      </SelectContent>
    </Select>
  );
}
