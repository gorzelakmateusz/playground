import { z } from "zod";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";

const formSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required."),
    surname: z.string().trim().optional(),
    email: z
      .string()
      .trim()
      .email("Invalid email.")
      .optional()
      .or(z.literal("")),
    phoneNumber: z
      .string()
      .trim()
      .min(9, "Phone number must have at least 9 digits.")
      .optional()
      .or(z.literal("")),
    prefferedContact: z.string().trim().optional(),
  })
  .refine(
    (data) => {
      const isEmailProvided = !!data.email && data.email.trim() !== "";
      const isPhoneNumberProvided =
        !!data.phoneNumber && data.phoneNumber.trim() !== "";
      return isEmailProvided || isPhoneNumberProvided;
    },
    {
      path: ["emailOrPhoneNumber"],
      message: "Please provide either an email address OR a phone number.",
    },
  )
  .refine(
    (data) => {
      const isEmailProvided = !!data.email && data.email.trim() !== "";
      const isPhoneNumberProvided =
        !!data.phoneNumber && data.phoneNumber.trim() !== "";

      if (isEmailProvided && isPhoneNumberProvided) {
        return !!data.prefferedContact && data.prefferedContact.trim() !== "";
      }
      return true;
    },
    {
      message:
        "Preferred contact is required when both email and phone number are provided.",
      path: ["prefferedContact"],
    },
  );

type FormData = z.infer<typeof formSchema>;

const ContactFormZod: React.FC = () => {
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      surname: "",
      email: "",
      phoneNumber: "",
      prefferedContact: "",
    },
  });

  const emailValue = watch("email");
  const phoneNumberValue = watch("phoneNumber");
  const showPreferredContact = !!emailValue && !!phoneNumberValue;

  const onSubmit = (data: FormData) => {
    console.log("Form submitted:", data);
    setSubmitMessage("Form submitted successfully!");
    reset();
  };

  return (
    <div>
      <h2>Contact Form (Zod)</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Name */}
        <div>
          <label htmlFor="name">Name:</label>
          <input type="text" id="name" {...register("name")} />
          {errors.name && <span>{errors.name.message}</span>}
        </div>

        {/* Surname */}
        <div>
          <label htmlFor="surname">Surname:</label>
          <input type="text" id="surname" {...register("surname")} />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email">Email:</label>
          <input type="email" id="email" {...register("email")} />
          {errors.email && <span>{errors.email.message}</span>}
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phoneNumber">Phone Number:</label>
          <input type="tel" id="phoneNumber" {...register("phoneNumber")} />
          {errors.phoneNumber && <span>{errors.phoneNumber.message}</span>}
        </div>

        {/* Preferred Contact */}
        {showPreferredContact && (
          <div>
            <label htmlFor="prefferedContact">Preferred Contact:</label>
            <input
              type="text"
              id="prefferedContact"
              {...register("prefferedContact")}
            />
            {errors.prefferedContact && (
              <span>{errors.prefferedContact.message}</span>
            )}
          </div>
        )}

        <button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit"}
        </button>
      </form>

      {submitMessage && <p>{submitMessage}</p>}
    </div>
  );
};

export default ContactFormZod;
