import React from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

// Zod schema
const formSchema = z
  .object({
    name: z.string().min(1, "Name is required."),
    surname: z.string().optional(),
    email: z.string().email("Invalid email.").optional(),
    phoneNumber: z
      .string()
      .optional()
      .refine((val) => !val || /^\d{9,}$/.test(val.replace(/\s/g, "")), {
        message: "Phone number must have at least 9 digits (no spaces).",
      }),
    prefferedContact: z.string().optional(),
  })
  .refine((data) => data.email || data.phoneNumber, {
    message: "Provide either email or phone number.",
    path: ["email"],
  })
  .refine(
    (data) =>
      !(data.email && data.phoneNumber) || !!data.prefferedContact?.trim(),
    {
      message:
        "Preferred contact is required when both email and phone number are provided.",
      path: ["prefferedContact"],
    },
  );

type FormData = z.infer<typeof formSchema>;

export default function ReactHookForm() {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitSuccessful },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = (data: FormData) => {
    console.log("Form submitted:", data);
    reset();
  };

  const showPreferredContact = !!watch("email") && !!watch("phoneNumber");

  return (
    <div>
      <h2>React Hook Form</h2>

      {isSubmitSuccessful && (
        <p style={{ color: "green" }}>Form submitted successfully!</p>
      )}

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* Name */}
        <div>
          <label htmlFor="name">Name:</label>
          <input id="name" {...register("name")} />
          {errors.name && <p style={{ color: "red" }}>{errors.name.message}</p>}
        </div>

        {/* Surname (optional) */}
        <div>
          <label htmlFor="surname">Surname (optional):</label>
          <input id="surname" {...register("surname")} />
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email">Email:</label>
          <input id="email" type="email" {...register("email")} />
          {errors.email && (
            <p style={{ color: "red" }}>{errors.email.message}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label htmlFor="phoneNumber">Phone Number:</label>
          <input id="phoneNumber" type="tel" {...register("phoneNumber")} />
          {errors.phoneNumber && (
            <p style={{ color: "red" }}>{errors.phoneNumber.message}</p>
          )}
        </div>

        {/* Preferred Contact */}
        {showPreferredContact && (
          <div>
            <label htmlFor="prefferedContact">Preferred Contact:</label>
            <input id="prefferedContact" {...register("prefferedContact")} />
            {errors.prefferedContact && (
              <p style={{ color: "red" }}>{errors.prefferedContact.message}</p>
            )}
          </div>
        )}

        <button type="submit">Submit</button>
      </form>
    </div>
  );
}
