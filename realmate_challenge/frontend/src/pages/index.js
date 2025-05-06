import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Box, Container, Heading, Button, VStack, Text } from '@chakra-ui/react';
import Login from '../components/Login';

export default function Home() {
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  useEffect(() => {
    // Se o usuário já estiver autenticado, redirecionar para a lista de conversas
    if (token) {
      router.push('/conversations');
    }
  }, [token, router]);

  return (
    <Container maxW="container.md" py={10}>
      <VStack spacing={8} align="center">
        <Heading as="h1" size="xl">Sistema de Atendimento WhatsApp</Heading>
        <Text fontSize="lg" textAlign="center">
          Faça login para acessar suas conversas ou registre-se para criar uma nova conta.
        </Text>
        
        <Box w="100%" maxW="500px">
          <Login />
        </Box>
        
        <Box>
          <Text mb={4}>Não tem uma conta?</Text>
          <Button colorScheme="teal" variant="outline" onClick={() => router.push('/register')}>
            Registrar-se
          </Button>
        </Box>
      </VStack>
    </Container>
  );
} 