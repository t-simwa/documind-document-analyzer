import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import ContactDemoForm from "./ContactDemoForm";

interface ContactDemoDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ContactDemoDialog = ({ open, onOpenChange }: ContactDemoDialogProps) => {
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSuccess = () => {
    setIsSuccess(true);
    // Auto-close after 3 seconds
    setTimeout(() => {
      setIsSuccess(false);
      onOpenChange(false);
    }, 3000);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[680px] max-h-[90vh] bg-black border border-white/[0.08] text-white p-0 overflow-hidden rounded-lg my-4 !grid-rows-[auto_1fr] !grid [&>button]:absolute [&>button]:right-5 [&>button]:top-5 [&>button]:text-white/40 [&>button]:hover:text-white/70 [&>button]:hover:bg-white/5 [&>button]:transition-colors [&>button]:rounded-md [&>button]:p-1.5">
        <div className="px-8 pt-8 pb-6">
          <DialogHeader className="space-y-3">
            <DialogTitle className="text-[28px] font-semibold tracking-tight text-white leading-tight">
              Request a Demo
            </DialogTitle>
            <DialogDescription className="text-[15px] text-white/50 leading-relaxed font-normal">
              {isSuccess
                ? "We've received your request and will contact you within 24 hours to schedule your personalized demo."
                : "Tell us about your needs and our team will reach out to schedule a personalized demonstration."}
            </DialogDescription>
          </DialogHeader>
        </div>

        {!isSuccess ? (
          <div className="px-8 pb-8 overflow-y-auto min-h-0">
            <ContactDemoForm onSuccess={handleSuccess} onCancel={handleCancel} />
          </div>
        ) : (
          <div className="px-8 pb-8 pt-4">
            <div className="flex flex-col items-center justify-center py-6">
              <div className="w-12 h-12 rounded-full border border-white/15 bg-white/[0.03] flex items-center justify-center mb-5">
                <svg
                  className="w-6 h-6 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 tracking-tight">
                Request Submitted
              </h3>
              <p className="text-sm text-white/50 text-center max-w-sm leading-relaxed">
                We'll send you a confirmation email shortly with next steps.
              </p>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ContactDemoDialog;

