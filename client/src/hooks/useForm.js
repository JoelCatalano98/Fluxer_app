import { useState } from 'react';

export const useForm = (initialState = {}) => {
  const [values, setValues] = useState(initialState);

  const handleInputChange = ({ target }) => {
    const { name, type, checked, value } = target;
    setValues({
      ...values,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const reset = () => {
    setValues(initialState);
  };

  return [values, handleInputChange, reset, setValues];
};
