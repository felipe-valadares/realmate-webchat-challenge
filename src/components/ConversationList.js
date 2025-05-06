import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import {
  Box, Heading, List, ListItem, Text, Badge, Flex, Spacer,
  Button, useToast, VStack, HStack, Icon, Divider, Avatar,
  Skeleton
} from '@chakra-ui/react';
import { ChatIcon, CheckCircleIcon, WarningIcon } from '@chakra-ui/icons';
import api from '../services/api';

export default function ConversationList() {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const toast = useToast();

  useEffect(() => {
    fetchConversations();
  }, [toast]);

  const fetchConversations = async () => {
    try {
      const response = await api.get('/my-conversations/');
      setConversations(response.data);
    } catch (error) {
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
  };

  const handleConversationClick = (id) => {
    router.push(`/conversations/${id}`);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    
    // Se for hoje, mostrar apenas a hora
    if (date.toDateString() === now.toDateString()) {
      return `Hoje, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Se for ontem
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return `Ontem, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    // Caso contrário, mostrar data completa
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const getLastMessage = (conversation) => {
    if (!conversation.messages || conversation.messages.length === 0) {
      return 'Nenhuma mensagem';
    }
    
    // Ordenar mensagens por timestamp e pegar a última
    const sortedMessages = [...conversation.messages].sort((a, b) => 
      new Date(b.timestamp) - new Date(a.timestamp)
    );
    
    return sortedMessages[0].content.length > 50 
      ? sortedMessages[0].content.substring(0, 50) + '...' 
      : sortedMessages[0].content;
  };

  if (loading) {
    return (
      <VStack spacing={4} align="stretch">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} height="100px" borderRadius="md" />
        ))}
      </VStack>
    );
  }

  if (conversations.length === 0) {
    return (
      <Box 
        textAlign="center" 
        py={10} 
        px={6}
        borderRadius="md"
        borderWidth="1px"
        borderStyle="dashed"
        borderColor="gray.300"
      >
        <Icon as={ChatIcon} boxSize="50px" color="gray.400" mb={4} />
        <Heading as="h2" size="md" color="gray.500" mb={2}>
          Nenhuma conversa encontrada
        </Heading>
        <Text color="gray.500">
          Clique no botão "Nova Conversa" para iniciar um atendimento.
        </Text>
      </Box>
    );
  }

  return (
    <List spacing={3}>
      {conversations.map((conversation) => (
        <ListItem 
          key={conversation.id} 
          onClick={() => handleConversationClick(conversation.id)}
          transition="all 0.2s"
          _hover={{ 
            transform: 'translateY(-2px)', 
            boxShadow: 'md', 
            cursor: 'pointer' 
          }}
        >
          <Box 
            p={4} 
            borderWidth="1px" 
            borderRadius="md"
            bg="white"
          >
            <Flex align="center">
              <Avatar 
                size="md" 
                bg={conversation.status === 'OPEN' ? 'teal.500' : 'gray.500'} 
                icon={<ChatIcon fontSize="1.5rem" color="white" />}
                mr={4}
              />
              
              <Box flex="1">
                <Flex align="center" mb={1}>
                  <Text fontWeight="bold" color="gray.700">
                    Conversa {conversation.id.substring(0, 8)}...
                  </Text>
                  <Spacer />
                  <Badge 
                    colorScheme={conversation.status === 'OPEN' ? 'green' : 'red'}
                    borderRadius="full"
                    px={3}
                    py={1}
                    fontSize="xs"
                  >
                    {conversation.status === 'OPEN' ? 'Aberta' : 'Fechada'}
                  </Badge>
                </Flex>
                
                <Text fontSize="sm" color="gray.600" mb={2} noOfLines={1}>
                  {getLastMessage(conversation)}
                </Text>
                
                <Flex align="center">
                  <Icon 
                    as={conversation.status === 'OPEN' ? CheckCircleIcon : WarningIcon} 
                    color={conversation.status === 'OPEN' ? 'green.500' : 'red.500'} 
                    mr={1} 
                    fontSize="xs"
                  />
                  <Text fontSize="xs" color="gray.500">
                    {formatDate(conversation.updated_at)}
                  </Text>
                  
                  {conversation.agent && (
                    <>
                      <Text fontSize="xs" color="gray.500" mx={2}>•</Text>
                      <Text fontSize="xs" color="gray.500">
                        Atendente: {conversation.agent.username}
                      </Text>
                    </>
                  )}
                </Flex>
              </Box>
            </Flex>
          </Box>
        </ListItem>
      ))}
    </List>
  );
} 