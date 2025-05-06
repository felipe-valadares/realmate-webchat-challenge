import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/router';
import {
  Box, Text, VStack, HStack, Badge, Flex, Spacer,
  Input, Button, useToast, Avatar, Icon, Divider,
  Skeleton, Textarea, IconButton, Tooltip
} from '@chakra-ui/react';
import { ChatIcon, CheckIcon, CloseIcon, InfoIcon, ArrowForwardIcon } from '@chakra-ui/icons';
import api from '../services/api';
import { v4 as uuidv4 } from 'uuid';

export default function ConversationDetail({ conversationId }) {
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    if (conversationId) {
      fetchConversation();
      
      // Configurar polling para atualizar a conversa a cada 5 segundos
      const intervalId = setInterval(fetchConversation, 5000);
      
      return () => clearInterval(intervalId);
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [conversation]);

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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;
    if (conversation.status !== 'OPEN') {
      toast({
        title: 'Conversa fechada',
        description: 'Não é possível enviar mensagens em uma conversa fechada',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setSending(true);
    
    try {
      const messageId = uuidv4();
      
      await api.post('/webhook/', {
        type: 'NEW_MESSAGE',
        timestamp: new Date().toISOString(),
        data: {
          id: messageId,
          direction: 'SENT',
          content: newMessage,
          conversation_id: conversationId
        }
      });
      
      setNewMessage('');
      fetchConversation(); // Atualizar a conversa para mostrar a nova mensagem
      
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Não foi possível enviar a mensagem',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setSending(false);
    }
  };

  const handleCloseConversation = async () => {
    try {
      await api.post('/webhook/', {
        type: 'CLOSE_CONVERSATION',
        timestamp: new Date().toISOString(),
        data: {
          id: conversationId
        }
      });
      
      toast({
        title: 'Conversa fechada',
        description: 'A conversa foi fechada com sucesso',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
      
      fetchConversation(); // Atualizar o status da conversa
      
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

  const formatMessageTime = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) {
    return (
      <VStack spacing={4} align="stretch">
        <Skeleton height="60px" borderRadius="md" />
        <Skeleton height="400px" borderRadius="md" />
        <Skeleton height="60px" borderRadius="md" />
      </VStack>
    );
  }

  if (!conversation) {
    return (
      <Box textAlign="center" py={10}>
        <Icon as={InfoIcon} boxSize="50px" color="orange.400" mb={4} />
        <Text fontSize="xl" fontWeight="bold">
          Conversa não encontrada
        </Text>
        <Button 
          mt={4} 
          colorScheme="teal" 
          onClick={() => router.push('/conversations')}
        >
          Voltar para a lista
        </Button>
      </Box>
    );
  }

  return (
    <Box>
      <Box 
        borderWidth="1px" 
        borderRadius="md" 
        overflow="hidden" 
        bg="white"
        mb={4}
        boxShadow="sm"
      >
        <Flex 
          align="center" 
          bg="gray.50" 
          p={4} 
          borderBottomWidth="1px"
        >
          <Avatar 
            bg={conversation.status === 'OPEN' ? 'teal.500' : 'red.500'} 
            icon={<ChatIcon fontSize="1.5rem" color="white" />}
            mr={3}
          />
          <Box>
            <Text fontWeight="bold">
              Conversa {conversation.id.substring(0, 8)}...
            </Text>
            <Text fontSize="xs" color="gray.500">
              Criada em: {new Date(conversation.created_at).toLocaleString()}
            </Text>
          </Box>
          <Spacer />
          <HStack>
            <Badge 
              colorScheme={conversation.status === 'OPEN' ? 'green' : 'red'}
              p={2}
              borderRadius="md"
              fontSize="sm"
            >
              {conversation.status === 'OPEN' ? 'Aberta' : 'Fechada'}
            </Badge>
            
            {conversation.status === 'OPEN' && (
              <Tooltip label="Fechar conversa" placement="top">
                <IconButton
                  icon={<CloseIcon />}
                  colorScheme="red"
                  variant="outline"
                  size="sm"
                  onClick={handleCloseConversation}
                  aria-label="Fechar conversa"
                />
              </Tooltip>
            )}
          </HStack>
        </Flex>
        
        <Box 
          p={4} 
          height="60vh" 
          overflowY="auto"
          bg="gray.50"
        >
          {conversation.messages.length === 0 ? (
            <Box 
              textAlign="center" 
              py={10}
              borderRadius="md"
              borderWidth="1px"
              borderStyle="dashed"
              borderColor="gray.300"
            >
              <Icon as={ChatIcon} boxSize="40px" color="gray.400" mb={3} />
              <Text color="gray.500">
                Nenhuma mensagem nesta conversa
              </Text>
            </Box>
          ) : (
            <VStack spacing={4} align="stretch">
              {conversation.messages
                .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
                .map((message) => (
                  <Box 
                    key={message.id}
                    alignSelf={message.direction === 'SENT' ? 'flex-end' : 'flex-start'}
                    maxWidth="70%"
                  >
                    <Flex 
                      direction={message.direction === 'SENT' ? 'row-reverse' : 'row'}
                      align="flex-start"
                    >
                      <Avatar 
                        size="sm" 
                        bg={message.direction === 'SENT' ? 'teal.500' : 'blue.500'} 
                        name={message.direction === 'SENT' ? 'Você' : 'Contato'}
                        mr={message.direction === 'SENT' ? 0 : 2}
                        ml={message.direction === 'SENT' ? 2 : 0}
                      />
                      <Box>
                        <Box 
                          bg={message.direction === 'SENT' ? 'teal.100' : 'white'}
                          p={3}
                          borderRadius="lg"
                          borderTopLeftRadius={message.direction === 'RECEIVED' ? 0 : undefined}
                          borderTopRightRadius={message.direction === 'SENT' ? 0 : undefined}
                          boxShadow="sm"
                        >
                          <Text>{message.content}</Text>
                        </Box>
                        <Text 
                          fontSize="xs" 
                          color="gray.500" 
                          textAlign={message.direction === 'SENT' ? 'right' : 'left'}
                          mt={1}
                        >
                          {formatMessageTime(message.timestamp)}
                          {message.direction === 'SENT' && (
                            <Icon as={CheckIcon} ml={1} color="green.500" />
                          )}
                        </Text>
                      </Box>
                    </Flex>
                  </Box>
                ))}
              <div ref={messagesEndRef} />
            </VStack>
          )}
        </Box>
      </Box>
      
      <Box 
        borderWidth="1px" 
        borderRadius="md" 
        p={4}
        bg="white"
        boxShadow="sm"
      >
        {conversation.status === 'OPEN' ? (
          <HStack>
            <Textarea 
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Digite sua mensagem..."
              size="md"
              resize="none"
              rows={2}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
            />
            <IconButton
              colorScheme="teal"
              aria-label="Enviar mensagem"
              icon={<ArrowForwardIcon />}
              onClick={handleSendMessage}
              isLoading={sending}
              isDisabled={!newMessage.trim()}
            />
          </HStack>
        ) : (
          <Box 
            textAlign="center" 
            py={3}
            bg="gray.50"
            borderRadius="md"
          >
            <Text color="gray.500">
              Esta conversa está fechada. Não é possível enviar novas mensagens.
            </Text>
          </Box>
        )}
      </Box>
    </Box>
  );
} 