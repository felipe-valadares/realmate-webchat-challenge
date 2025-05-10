import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box, Heading, Text, VStack, HStack, Badge, Flex, Spacer,
  Input, Button, useToast
} from '@chakra-ui/react';
import api from '../services/api';
import { v4 as uuidv4 } from 'uuid';
export default function ConversationDetail({ conversationId }) {
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const response = await api.get(`/conversations/${conversationId}/`);
        setConversation(response.data);
      } catch (error) {
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar a conversa',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
        router.push('/conversations');
      } finally {
        setLoading(false);
      }
    };

    if (conversationId) {
      fetchConversation();
    }
  }, [conversationId, router, toast]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    try {
      const sendMessagePayload = {
        type: 'NEW_MESSAGE',
        timestamp: new Date().toISOString(),
        data: {
          "id": uuidv4(),
          "direction": "SENT",
          "content": newMessage,
          "conversation_id": conversationId,
        }
      };
      console.log(sendMessagePayload);
      await api.post(`/webhook/`, sendMessagePayload);
      toast({
        title: 'Mensagem enviada',
        description: 'Sua mensagem foi enviada com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setNewMessage('');
      
      // Recarregar a conversa para ver a nova mensagem
      const response = await api.get(`/conversations/${conversationId}/`);
      setConversation(response.data);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  if (loading) {
    return <Text>Carregando conversa...</Text>;
  }

  if (!conversation) {
    return <Text>Conversa não encontrada</Text>;
  }

  const handleCloseConversation = async () => {
    try {
      const closeConversationPayload = {
        type: 'CLOSE_CONVERSATION',
        timestamp: new Date().toISOString(),
        data: { id: conversationId }
      };

      await api.post(`/webhook/`, closeConversationPayload);

      // Atualiza o status local da conversa para "CLOSED"
      setConversation(prev => ({
        ...prev,
        status: 'CLOSED'
      }));

      toast({
        title: 'Conversa fechada',
        description: 'A conversa foi fechada com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível fechar a conversa',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };


  return (
    <Box>
      <Flex align="center" mb={4} justifyContent="space-between">
        <Heading size="lg">Conversa</Heading>
        <Box display="flex" alignItems="center" gap={2}>
          <Badge 
          colorScheme={conversation.status === 'OPEN' ? 'green' : 'red'}
          p={2}
          borderRadius="md"
          fontSize="md"
        >
          {conversation.status}
        </Badge>
        <Button colorScheme="red" onClick={handleCloseConversation}>Fechar Conversa</Button>
        </Box>
      </Flex>
      
      <Box 
        borderWidth={1} 
        borderRadius="md" 
        p={4} 
        height="60vh" 
        overflowY="auto"
        mb={4}
        
      >
        {conversation.messages.length === 0 ? (
          <Text>Nenhuma mensagem nesta conversa</Text>
        ) : (
          <VStack spacing={4} align="stretch">
            {conversation.messages.map((message) => (
              <Box 
                key={message.id}
                bg={message.direction === 'SENT' ? 'blue.100' : 'gray.100'}
                p={3}
                borderRadius="md"
                alignSelf={message.direction === 'SENT' ? 'flex-end' : 'flex-start'}
                maxWidth="70%"
              >
                <Text>{message.content}</Text>
                <Text fontSize="xs" color="gray.500" textAlign="right">
                  {new Date(message.timestamp).toLocaleString()}
                </Text>
              </Box>
            ))}
          </VStack>
        )}
      </Box>
      
      {conversation.status === 'OPEN' && (
        <HStack>
          <Input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Digite sua mensagem..."
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <Button colorScheme="blue" onClick={handleSendMessage}>
            Enviar
          </Button>
        </HStack>
      )}
    </Box>
  );
} 