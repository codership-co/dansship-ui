import { Button, Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from 'dansship-ui';

export function Default() {
  return (
    <Dialog open>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel subscription</DialogTitle>
        </DialogHeader>
        <p style={{ margin: 0 }}>
          Are you sure you want to cancel your subscription? You'll keep access until the end of your
          current billing period.
        </p>
        <DialogFooter>
          <Button variant='outline'>Keep subscription</Button>
          <Button variant='destructive'>Cancel subscription</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
