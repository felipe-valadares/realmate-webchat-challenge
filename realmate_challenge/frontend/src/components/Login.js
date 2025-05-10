import { useState } from 'react';
import { useRouter } from 'next/router';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Box, Button, FormControl, FormLabel, Input, FormErrorMessage,
  Heading, VStack, Alert, AlertIcon
} from '@chakra-ui/react';
import api from '../services/api';

const LoginSchema = Yup.object().shape({
  username: Yup.string().required('Obrigatório'),
  password: Yup.string().required('Obrigatório'),
});

export default function Login() {
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (values, actions) => {
    try {
      const response = await api.post('/login/', values);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      router.push('/conversations');
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao fazer login');
    } finally {
      actions.setSubmitting(false);
    }
  };

  return (
    <Box p={8} maxWidth="500px" borderWidth={1} borderRadius={8} boxShadow="lg">
      <Box textAlign="center">
        <Heading>Login</Heading>
      </Box>
      <Box my={4} textAlign="left">
        {error && (
          <Alert status="error" mb={4}>
            <AlertIcon />
            {error}
          </Alert>
        )}
        <Formik
          initialValues={{ username: '', password: '' }}
          validationSchema={LoginSchema}
          onSubmit={handleSubmit}
        >
          {(props) => (
            <Form>
              <VStack spacing={4}>
                <Field name="username">
                  {({ field, form }) => (
                    <FormControl isInvalid={form.errors.username && form.touched.username}>
                      <FormLabel htmlFor="username">Nome de usuário</FormLabel>
                      <Input {...field} id="username" placeholder="Nome de usuário" />
                      <FormErrorMessage>{form.errors.username}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Field name="password">
                  {({ field, form }) => (
                    <FormControl isInvalid={form.errors.password && form.touched.password}>
                      <FormLabel htmlFor="password">Senha</FormLabel>
                      <Input {...field} id="password" type="password" placeholder="Senha" />
                      <FormErrorMessage>{form.errors.password}</FormErrorMessage>
                    </FormControl>
                  )}
                </Field>
                <Button
                  mt={4}
                  colorScheme="teal"
                  isLoading={props.isSubmitting}
                  type="submit"
                  width="full"
                >
                  Entrar
                </Button>
              </VStack>
            </Form>
          )}
        </Formik>
      </Box>
    </Box>
  );
} 