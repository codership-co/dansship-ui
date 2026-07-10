import { LuCircleCheck, LuInfo, LuLoader, LuOctagonX, LuTriangleAlert } from 'react-icons/lu';
import { Toaster as Sonner, type ToasterProps } from 'sonner';

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme='light'
      position='bottom-left'
      icons={{
        success: <LuCircleCheck className='size-4' />,
        info: <LuInfo className='size-4' />,
        warning: <LuTriangleAlert className='size-4' />,
        error: <LuOctagonX className='size-4' />,
        loading: <LuLoader className='size-4 animate-spin' />,
      }}
      style={
        {
          '--normal-bg': 'var(--color-primary-100)',
          '--normal-text': 'var(--color-primary)',
          '--normal-border': 'var(--color-primary)',
          '--border-radius': 'calc(var(--radius) * 4)',
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
