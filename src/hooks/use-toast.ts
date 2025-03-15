
import { useToast as useToastHook } from "@/components/ui/toast";

export const useToast = useToastHook;

export const toast = {
  ...useToastHook().toast,
  // Enhanced toast with a default duration and automatic dismissal
  default: (props: any) => useToastHook().toast({
    ...props,
    duration: props.duration || 5000,
  }),
};

export default useToast;
