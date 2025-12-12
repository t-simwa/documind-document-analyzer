import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Form validation schema
const contactFormSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Please enter a valid email address"),
  company: z.string().min(2, "Company name must be at least 2 characters").max(100, "Company name must be less than 100 characters"),
  phone: z.string().optional().refine(
    (val) => !val || /^[\d\s\-\+\(\)]+$/.test(val),
    "Please enter a valid phone number"
  ),
  useCase: z.enum([
    "legal",
    "research",
    "healthcare",
    "finance",
    "education",
    "government",
    "other"
  ], {
    required_error: "Please select a use case",
  }),
  message: z.string().min(10, "Message must be at least 10 characters").max(1000, "Message must be less than 1000 characters"),
});

type ContactFormValues = z.infer<typeof contactFormSchema>;

interface ContactDemoFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

const ContactDemoForm = ({ onSuccess, onCancel }: ContactDemoFormProps) => {
  const { toast } = useToast();

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      phone: "",
      useCase: undefined,
      message: "",
    },
  });

  const onSubmit = async (data: ContactFormValues) => {
    try {
      // Simulate API call - Replace with actual API endpoint
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // In production, replace with actual API call:
      // const response = await fetch('/api/v1/contact/demo', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data),
      // });
      // if (!response.ok) throw new Error('Failed to submit');

      toast({
        title: "Demo request submitted!",
        description: "We'll get back to you within 24 hours.",
      });

      form.reset();
      onSuccess?.();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to submit your request. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isSubmitting = form.formState.isSubmitting;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-7">
        {/* Name and Email Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem className="space-y-2.5">
                <FormLabel className="text-sm font-medium text-white/90 tracking-tight">
                  Full Name
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    {...field}
                    disabled={isSubmitting}
                    className="h-11 bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus-visible:border-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors text-[15px]"
                  />
                </FormControl>
                <FormMessage className="text-xs text-white/50" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem className="space-y-2.5">
                <FormLabel className="text-sm font-medium text-white/90 tracking-tight">
                  Business Email
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="john@company.com"
                    {...field}
                    disabled={isSubmitting}
                    className="h-11 bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus-visible:border-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors text-[15px]"
                  />
                </FormControl>
                <FormMessage className="text-xs text-white/50" />
              </FormItem>
            )}
          />
        </div>

        {/* Company and Phone Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <FormField
            control={form.control}
            name="company"
            render={({ field }) => (
              <FormItem className="space-y-2.5">
                <FormLabel className="text-sm font-medium text-white/90 tracking-tight">
                  Company
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Acme Inc."
                    {...field}
                    disabled={isSubmitting}
                    className="h-11 bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus-visible:border-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors text-[15px]"
                  />
                </FormControl>
                <FormMessage className="text-xs text-white/50" />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem className="space-y-2.5">
                <FormLabel className="text-sm font-medium text-white/90 tracking-tight">
                  Phone
                  <span className="ml-1.5 text-white/40 font-normal text-xs">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    {...field}
                    disabled={isSubmitting}
                    className="h-11 bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus-visible:border-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 transition-colors text-[15px]"
                  />
                </FormControl>
                <FormMessage className="text-xs text-white/50" />
              </FormItem>
            )}
          />
        </div>

        {/* Use Case */}
        <FormField
          control={form.control}
          name="useCase"
          render={({ field }) => (
            <FormItem className="space-y-2.5">
              <FormLabel className="text-sm font-medium text-white/90 tracking-tight">
                Primary Use Case
              </FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger className="h-11 bg-white/[0.03] border-white/10 text-white focus:ring-0 focus:ring-offset-0 focus:border-white/20 transition-colors text-[15px] data-[placeholder]:text-white/30">
                    <SelectValue placeholder="Select your use case" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent className="bg-black border-white/10">
                  <SelectItem value="legal" className="text-white focus:bg-white/5 focus:text-white">Legal & Compliance</SelectItem>
                  <SelectItem value="research" className="text-white focus:bg-white/5 focus:text-white">Research & Academia</SelectItem>
                  <SelectItem value="healthcare" className="text-white focus:bg-white/5 focus:text-white">Healthcare</SelectItem>
                  <SelectItem value="finance" className="text-white focus:bg-white/5 focus:text-white">Finance & Banking</SelectItem>
                  <SelectItem value="education" className="text-white focus:bg-white/5 focus:text-white">Education</SelectItem>
                  <SelectItem value="government" className="text-white focus:bg-white/5 focus:text-white">Government</SelectItem>
                  <SelectItem value="other" className="text-white focus:bg-white/5 focus:text-white">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage className="text-xs text-white/50" />
            </FormItem>
          )}
        />

        {/* Message */}
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem className="space-y-2.5">
              <FormLabel className="text-sm font-medium text-white/90 tracking-tight">
                Tell us about your needs
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="What challenges are you looking to solve? What documents do you need to analyze?"
                  className="min-h-[132px] bg-white/[0.03] border-white/10 text-white placeholder:text-white/30 focus-visible:border-white/20 focus-visible:ring-0 focus-visible:ring-offset-0 resize-none transition-colors text-[15px] leading-relaxed"
                  {...field}
                  disabled={isSubmitting}
                />
              </FormControl>
              <div className="flex items-center justify-between">
                <FormMessage className="text-xs text-white/50" />
                <FormDescription className="text-xs text-white/40 font-normal m-0">
                  {field.value?.length || 0} / 1000
                </FormDescription>
              </div>
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end pt-6 border-t border-white/[0.06]">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="h-11 px-6 border-white/10 text-white/60 hover:bg-white/[0.03] hover:text-white/90 hover:border-white/15 transition-all font-medium text-sm"
            >
              Cancel
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting}
            className="h-11 px-6 bg-white text-black hover:bg-white/95 font-medium text-sm transition-all min-w-[140px] disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Submitting
              </>
            ) : (
              "Request Demo"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ContactDemoForm;

