import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Container, Box, Heading, Button, Flex, Spacer,
  useToast
} from '@chakra-ui/react';
import ConversationList from '../../components/ConversationList';

export default function Conversations() {
  const [user, setUser] = useState(null);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    // Verificar se o usuário está autenticado
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (!token || !userData) {
      toast({
        title: 'Não autenticado',
        description: 'Você precisa fazer login para acessar esta página',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      router.push('/');
      return;
    }
    
    try {
      setUser(JSON.parse(userData));
    } catch (e) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      router.push('/');
    }
  }, [router, toast]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/');
  };

  if (!user) {
    return null; // Ou um componente de carregamento
  }

  return (
    <Container maxW="container.lg" py={5}>
      <Flex align="center" mb={6}>
        <Box>
          <Heading size="lg" color="blue.500">Chats com a Rafa</Heading>
          <Box fontSize="sm" color="gray.600">
            Logado como: {user.username}
          </Box>
        </Box>
        <Spacer />
        <Button colorScheme="red" onClick={handleLogout}>
          Sair
        </Button>
      </Flex>
      
      <Box>
        <ConversationList />
      </Box>
    </Container>
  );
} 