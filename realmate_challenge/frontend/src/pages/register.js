import { useState } from 'react';
import { useRouter } from 'next/router';
import { Formik, Form, Field } from 'formik';
import * as Yup from 'yup';
import {
  Box, Button, FormControl, FormLabel, Input, FormErrorMessage,
  Heading, VStack, Alert, AlertIcon, Container, Checkbox, Link
} from '@chakra-ui/react';
import api from '../services/api';

const RegisterSchema = Yup.object().shape({
  username: Yup.string().required('Obrigatório'),
  password: Yup.string().required('Obrigatório').min(6, 'Mínimo de 6 caracteres'),
  email: Yup.string().email('Email inválido').required('Obrigatório'),
  first_name: Yup.string(),
  last_name: Yup.string(),
  is_agent: Yup.boolean()
});

export default function Register() {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (values, actions) => {
    try {
      await api.post('/register/', values);
      setSuccess(true);
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Erro ao registrar');
    } finally {
      actions.setSubmitting(false);
    }
  };

  return (
    <Container maxW="container.md" py={10}>
      <Box p={8} maxWidth="500px" borderWidth={1} borderRadius={8} boxShadow="lg" mx="auto">
        <Box textAlign="center">
          <Heading>Registrar</Heading>
        </Box>
        <Box my={4} textAlign="left">
          {error && (
            <Alert status="error" mb={4}>
              <AlertIcon />
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert status="success" mb={4}>
              <AlertIcon />
              Registro realizado com sucesso! Redirecionando para o login...
            </Alert>
          )}
          
          <Formik
            initialValues={{ 
              username: '', 
              password: '', 
              email: '', 
              first_name: '', 
              last_name: '', 
              is_agent: false 
            }}
            validationSchema={RegisterSchema}
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
                  
                  <Field name="email">
                    {({ field, form }) => (
                      <FormControl isInvalid={form.errors.email && form.touched.email}>
                        <FormLabel htmlFor="email">Email</FormLabel>
                        <Input {...field} id="email" type="email" placeholder="Email" />
                        <FormErrorMessage>{form.errors.email}</FormErrorMessage>
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
                  
                  <Field name="first_name">
                    {({ field, form }) => (
                      <FormControl>
                        <FormLabel htmlFor="first_name">Nome</FormLabel>
                        <Input {...field} id="first_name" placeholder="Nome" />
                      </FormControl>
                    )}
                  </Field>
                  
                  <Field name="last_name">
                    {({ field, form }) => (
                      <FormControl>
                        <FormLabel htmlFor="last_name">Sobrenome</FormLabel>
                        <Input {...field} id="last_name" placeholder="Sobrenome" />
                      </FormControl>
                    )}
                  </Field>
                  
                  <Field name="is_agent">
                    {({ field, form }) => (
                      <FormControl>
                        <Checkbox {...field} id="is_agent">
                          Registrar como atendente
                        </Checkbox>
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
                    Registrar
                  </Button>
                  
                  <Box textAlign="center" pt={2}>
                    <Link color="teal.500" onClick={() => router.push('/')}>
                      Já tem uma conta? Faça login
                    </Link>
                  </Box>
                </VStack>
              </Form>
            )}
          </Formik>
        </Box>
      </Box>
    </Container>
  );
} 