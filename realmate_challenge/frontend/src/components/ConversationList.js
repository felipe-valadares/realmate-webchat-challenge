import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box, Heading, List, ListItem, Text, Badge, Flex, Spacer,
  Button, useToast
} from '@chakra-ui/react';
import api from '../services/api';
import { v4 as uuidv4 } from 'uuid';

export default function ConversationList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    async function fetchConversations() {
      try {
        const response = await api.get('/my-conversations/');
        const sortedConversations = response.data.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
        setConversations(sortedConversations);
      } catch {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar as conversas',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      } finally {
        setLoading(false);
      }
    }
    fetchConversations();
  }, [toast]);

  const handleCreateConversation = async () => {
    try {
      const createConversationPayload = {
        type: 'NEW_CONVERSATION',
        timestamp: new Date().toISOString(),
        data: {
          id: uuidv4(),
        }
      };

      const res = await api.post('/webhook/', createConversationPayload);
      router.push(`/conversations/${res.data.conversation_id}`);
    } catch (error) {
      console.error('Erro ao criar conversa:', error.response?.data);
      toast({
        title: 'Erro',
        description: 'Não foi possível criar a conversa',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return <Text>Carregando conversas...</Text>;
  }

  return (
    <Box p={8}>
      <Flex mb={2} align="center" gap={20} justifyContent="space-between">
        <Heading size="md">Minhas Conversas</Heading>
        <Button
          size="sm"
          colorScheme="blue"
          onClick={handleCreateConversation}   // usa a função acima
        >
          Nova Conversa
        </Button>
      </Flex>

      {conversations.length === 0 ? (
        <Text>Nenhuma conversa encontrada</Text>
      ) : (
        <List spacing={3}>
          {conversations.map((c) => (
            <ListItem
              key={c.id}
              p={4}
              borderWidth={1}
              borderRadius="md"
              _hover={{ bg: 'gray.50', cursor: 'pointer' }}
              onClick={() => router.push(`/conversations/${c.id}`)}
            >
              <Flex align="center">
                <Box>
                  <Text fontWeight="bold">
                    Conversa {c.id.substring(0, 8)}...
                  </Text>
                  <Text fontSize="sm">
                    Criada em: {new Date(c.created_at).toLocaleString()}
                  </Text>
                  <Text fontSize="sm">
                    Atualizada em: {new Date(c.updated_at).toLocaleString()}
                  </Text>
                </Box>
                <Spacer />
                <Badge
                  colorScheme={c.status === 'OPEN' ? 'green' : 'red'}
                  p={2}
                  borderRadius="md"
                >
                  {c.status}
                </Badge>
              </Flex>
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
} 