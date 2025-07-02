import React, { useState } from "react";

const SimpleForm: React.FC = () => {
  interface FormData {
    name: string;
    surname: string;
    email: string;
    phoneNumber: string;
    prefferedContact: string;
  }

  const [formData, setFormData] = useState<FormData>({
    name: "",
    surname: "",
    email: "",
    phoneNumber: "",
    prefferedContact: "",
  });

  const [submitMessage, setSubmitMessage] = useState<string | null>(null);

  // State to hold validation errors for each field.
  // Using an empty object as initial state to avoid 'undefined' issues.
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;

    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));

    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "", // Clear the error for the current field
      ...(name === "email" || name === "phoneNumber"
        ? { emailOrPhoneNumber: "" }
        : {}), // Clear the combined error
    }));

    // Clear the general submit message as the user starts typing again
    setSubmitMessage(null);
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}; // Object to collect all errors

    if (!formData.name.trim()) {
      newErrors.name = "Name is required.";
    }

    // Surname is optional - no validation added here to make it required.

    // Email OR Phone Number is required (at least one)
    const isEmailProvided = formData.email.trim() !== "";
    const isPhoneNumberProvided = formData.phoneNumber.trim() !== "";

    if (!isEmailProvided && !isPhoneNumberProvided) {
      newErrors.emailOrPhoneNumber =
        "Please provide either an email address OR a phone number.";
    }

    // Validate Email format if email is provided
    if (isEmailProvided && !/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address.";
    }

    // Validate Phone Number format if phone number is provided
    // This regex checks for at least 9 digits, allowing spaces (which are removed for validation)
    if (
      isPhoneNumberProvided &&
      !/^\d{9,}$/.test(formData.phoneNumber.replace(/\s/g, ""))
    ) {
      newErrors.phoneNumber =
        "Phone number must contain at least 9 digits (spaces are ignored).";
    }

    // Preferred Contact is required ONLY if both Email AND Phone Number are provided
    const shouldShowPreferredContactField =
      isEmailProvided && isPhoneNumberProvided;
    if (shouldShowPreferredContactField && !formData.prefferedContact.trim()) {
      newErrors.prefferedContact =
        "Preferred contact method is required when both Email and Phone are provided.";
    }

    // Update the errors state
    setErrors(newErrors);

    // Return true if there are no errors (form is valid), false otherwise
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault(); // Prevents the browser's default form submission (page reload)

    if (validateForm()) {
      setSubmitMessage("Form submitted successfully!");
      console.log("Form data:", formData); // Log data to console for inspection
      // Clear the form fields after successful submission
      setFormData({
        name: "",
        surname: "",
        email: "",
        phoneNumber: "",
        prefferedContact: "",
      });
      setErrors({}); // Clear any previous errors
    } else {
      setSubmitMessage("Please correct the errors in the form.");
      // Specific errors are already set by validateForm and displayed under fields
    }
  };

  // Logic for dynamic display of the Preferred Contact field
  const showPreferredContactField =
    formData.email.trim() !== "" && formData.phoneNumber.trim() !== "";

  return (
    <div>
      <h2>Simple Contact Form</h2>

      {/* General submission message display */}
      {submitMessage && (
        <p
          style={{
            color: submitMessage.includes("successfully") ? "green" : "red",
          }}
        >
          {submitMessage}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        {/* Name Field */}
        <div>
          <label htmlFor="name">Name:</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
          />
          {/* Display error for 'name' if it exists */}
          {errors.name && (
            <p style={{ color: "red", fontSize: "0.8em" }}>{errors.name}</p>
          )}
        </div>

        {/* Surname Field (optional) */}
        <div>
          <label htmlFor="surname">Surname (optional):</label>
          <input
            type="text"
            id="surname"
            name="surname"
            value={formData.surname}
            onChange={handleChange}
          />
          {/* No 'errors.surname' display as it's optional, unless you add format validation later */}
        </div>

        {/* Email Field */}
        <div>
          <label htmlFor="email">Email:</label>
          <input
            type="email" // Keeps browser's basic email validation, but custom validation takes precedence
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
          />
          {/* Display error for 'email' if it exists */}
          {errors.email && (
            <p style={{ color: "red", fontSize: "0.8em" }}>{errors.email}</p>
          )}
        </div>

        {/* Phone Number Field */}
        <div>
          <label htmlFor="phoneNumber">Phone Number:</label>
          <input
            type="tel" // Suggests numeric keyboard on mobile, no strict browser validation
            id="phoneNumber"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
          />
          {/* Display error for 'phoneNumber' if it exists */}
          {errors.phoneNumber && (
            <p style={{ color: "red", fontSize: "0.8em" }}>
              {errors.phoneNumber}
            </p>
          )}
          {/* Display combined email OR phone error if it exists */}
          {errors.emailOrPhoneNumber && (
            <p style={{ color: "red", fontSize: "0.8em" }}>
              {errors.emailOrPhoneNumber}
            </p>
          )}
        </div>

        {/* Preferred Contact Field - Dynamically displayed */}
        {showPreferredContactField && (
          <div>
            <label htmlFor="prefferedContact">Preferred Contact:</label>
            <input
              type="text"
              id="prefferedContact"
              name="prefferedContact"
              value={formData.prefferedContact}
              onChange={handleChange}
            />
            {/* Display error for 'prefferedContact' if it exists */}
            {errors.prefferedContact && (
              <p style={{ color: "red", fontSize: "0.8em" }}>
                {errors.prefferedContact}
              </p>
            )}
          </div>
        )}

        {/* Submit Button */}
        <button type="submit">Submit</button>
      </form>
    </div>
  );
};

export default SimpleForm;
