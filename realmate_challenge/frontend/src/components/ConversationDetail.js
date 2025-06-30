import { useEffect, useState, useRef, useLayoutEffect } from 'react';
import { useRouter } from 'next/router';
import {
  Box, Heading, Text, VStack, HStack, Badge, Flex, Spacer,
  Input, Button, useToast
} from '@chakra-ui/react';
import api from '../services/api';
import { v4 as uuidv4 } from 'uuid';

export default function ConversationDetail({ conversationId }) {
  const currentUser = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user')) : null;
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const router = useRouter();
  const toast = useToast();
  const [pendingMessages, setPendingMessages] = useState([]);
  const [messageStatuses, setMessageStatuses] = useState({});
  const containerRef = useRef(null);
  // Flag para rolagem inicial ao bottom
  const didInitialScroll = useRef(false);
  // Flag para indicar se o usuário está no fim da lista de mensagens
  const isAtBottomRef = useRef(true);
  // Handler para atualizar flag quando o usuário rolar a lista
  const handleScroll = () => {
    const el = containerRef.current;
    if (!el) return;
    isAtBottomRef.current = (el.scrollHeight - el.scrollTop) <= (el.clientHeight + 5);
  };

  useEffect(() => {
    const fetchConversation = async () => {
      try {
        const response = await api.get(`/conversations/${conversationId}/`);
        setConversation(response.data);
        setPendingMessages([]);
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

  useEffect(() => {
    if (!conversationId) return;
    // Conectar no WebSocket do backend (porta 8000)
    const wsUrl = `ws://${window.location.hostname}:8000/ws/conversations/${conversationId}/`;
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setPendingMessages(prev => prev.filter(m => m.id !== data.id));
      setMessageStatuses(prev => ({ ...prev, [data.id]: 'processed' }));
      setConversation(prev => ({
        ...prev,
        messages: [...prev.messages, data]
      }));
    };
    return () => ws.close();
  }, [conversationId]);

  // Rola até o bottom na primeira renderização dos messages
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || didInitialScroll.current) return;
    el.scrollTop = el.scrollHeight;
    didInitialScroll.current = true;
  }, [conversation?.messages?.length]);

  // Auto-scroll: se o usuário estiver no fim, mover para bottom após nova mensagem
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Se estava no fim, rolar para exibir nova mensagem
    if (isAtBottomRef.current) {
      requestAnimationFrame(() => {
        el.scrollTop = el.scrollHeight;
      });
    }
  }, [conversation?.messages?.length, pendingMessages.length]);

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    const messageId = uuidv4();
    const timestamp = new Date().toISOString();
    try {
      const sendMessagePayload = {
        type: 'NEW_MESSAGE',
        timestamp,
        data: {
          id: messageId,
          content: newMessage,
          conversation_id: conversationId,
        }
      };
      console.log(sendMessagePayload);
      await api.post(`/webhook/`, sendMessagePayload);
      setPendingMessages(prev => [...prev, { id: messageId, type: 'INBOUND', content: newMessage, timestamp }]);
      setMessageStatuses(prev => ({ ...prev, [messageId]: 'pending' }));
      toast({
        title: 'Mensagem enviada',
        description: 'Sua mensagem foi enviada com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      setNewMessage('');
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
        ref={containerRef}
        onScroll={handleScroll}
      >
        {conversation.messages.length === 0 && pendingMessages.length === 0 ? (
          <Text>Nenhuma mensagem nesta conversa</Text>
        ) : (
          <VStack spacing={4} align="stretch">
            {conversation.messages.map((message) => {
              const isInbound = message.type === 'INBOUND';
              if (!isInbound) return null;
              const authorId = message.author && message.author.id !== undefined
                ? message.author.id
                : message.author;
              const isMine = authorId === currentUser.id;
              return (
                <Box
                  key={message.id}
                  bg={isMine ? 'blue.100' : 'gray.100'}
                  p={3}
                  borderRadius="md"
                  alignSelf={isMine ? 'flex-end' : 'flex-start'}
                  maxWidth="70%"
                >
                  <Text>{message.content}</Text>
                  <Flex align="center" justify="space-between">
                    <Text fontSize="xs" color="gray.500">
                      {new Date(message.timestamp).toLocaleString()}
                    </Text>
                    {messageStatuses[message.id] === 'pending' && (
                      <Badge colorScheme="yellow">Enviando...</Badge>
                    )}
                  </Flex>
                </Box>
              );
            })}
            {pendingMessages.map((msg) => (
              <Box
                key={msg.id}
                bg="blue.50"
                p={3}
                borderRadius="md"
                alignSelf="flex-end"
                maxWidth="70%"
                borderStyle="dashed"
                borderWidth="1px"
              >
                <Text>{msg.content}</Text>
                <Flex align="center" justify="space-between">
                  <Text fontSize="xs" color="gray.500">
                    {new Date(msg.timestamp).toLocaleString()}
                  </Text>
                  <Badge colorScheme="yellow">Enviando...</Badge>
                </Flex>
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