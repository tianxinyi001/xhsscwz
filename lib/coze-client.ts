import { CozeChatRequest, CozeChatResponse, CozeMessage } from './types';

const COZE_API_URL = process.env.NEXT_PUBLIC_COZE_API_URL || 'https://api.coze.cn/v3/chat';
const BOT_ID = process.env.NEXT_PUBLIC_COZE_BOT_ID || '7511177632999342117';
const API_KEY = process.env.COZE_API_KEY || 'pat_9UEWSBMIFNPeyPudzSY2ceH26GSz2WYmbvKlutYlH6fcH1Zhxy8Ux7IPRc0AmMOZ';

export class CozeClient {
  private apiKey: string;
  private botId: string;

  constructor() {
    this.apiKey = API_KEY;
    this.botId = BOT_ID;
  }

  async extractXHSInfo(url: string, quickPreview: boolean = false): Promise<string> {
    const message: CozeMessage = {
      role: 'user',
      content: quickPreview ? `请快速提取这个小红书链接的标题和封面：${url}` : url,
      content_type: 'text'
    };

    const requestBody: CozeChatRequest = {
      bot_id: this.botId,
      user_id: `user_${Date.now()}`,
      stream: false,
      auto_save_history: true, // 始终保存历史，避免流式传输的复杂性
      additional_messages: [message]
    };

    console.log('发送请求到 Coze API:', {
      url: COZE_API_URL,
      bot_id: this.botId,
      user_message: url
    });

    try {
      // 第一步：创建对话
      const response = await fetch(COZE_API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('API 响应状态:', response.status, response.statusText);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API 请求失败:', response.status, errorText);
        throw new Error(`API 请求失败: ${response.status} ${response.statusText}. 响应: ${errorText}`);
      }

      const result = await response.json();
      console.log('API 响应数据:', JSON.stringify(result, null, 2));
      
      // 检查是否有 code 字段
      if (result.code !== undefined && result.code !== 0) {
        const errorMessage = result.message || result.msg || '未知错误';
        console.error('API 返回错误:', result.code, errorMessage);
        throw new Error(`API 返回错误 (${result.code}): ${errorMessage}`);
      }

      // 如果对话状态是 in_progress，需要轮询获取结果
      if (result.data?.status === 'in_progress') {
        const conversationId = result.data.conversation_id;
        const chatId = result.data.id;
        
        console.log('对话进行中，开始轮询结果...');
        return await this.pollChatResult(conversationId, chatId);
      }

      // 如果有直接的内容，返回
      const content = result.data?.content || 
                     result.content || 
                     result.data?.message ||
                     result.message ||
                     JSON.stringify(result);

      console.log('提取的内容:', content);
      return content;

    } catch (error) {
      console.error('Coze API 调用失败:', error);
      throw error;
    }
  }

  // 轮询获取对话结果
  async pollChatResult(conversationId: string, chatId: string, maxAttempts = 30): Promise<string> {
    const pollUrl = `https://api.coze.cn/v3/chat/retrieve?conversation_id=${conversationId}&chat_id=${chatId}`;
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        console.log(`轮询第 ${attempt + 1} 次，获取对话结果...`);
        
        const response = await fetch(pollUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          console.error('轮询请求失败:', response.status, response.statusText);
          continue;
        }

        const result = await response.json();
        console.log('轮询响应:', JSON.stringify(result, null, 2));

        // 检查对话状态
        if (result.data?.status === 'completed') {
          // 对话完成，获取消息列表
          return await this.getChatMessages(conversationId, chatId);
        } else if (result.data?.status === 'failed') {
          throw new Error('对话处理失败');
        }

        // 等待2秒后继续轮询
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error(`轮询第 ${attempt + 1} 次失败:`, error);
        if (attempt === maxAttempts - 1) {
          throw new Error('轮询超时，未能获取对话结果');
        }
      }
    }

    throw new Error('轮询超时，未能获取对话结果');
  }

  // 获取对话消息
  async getChatMessages(conversationId: string, chatId: string): Promise<string> {
    const messagesUrl = `https://api.coze.cn/v3/chat/message/list?conversation_id=${conversationId}&chat_id=${chatId}`;
    
    try {
      const response = await fetch(messagesUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`获取消息失败: ${response.status}`);
      }

      const result = await response.json();
      console.log('消息列表:', JSON.stringify(result, null, 2));

      // 查找消息
      const messages = result.data || [];
      
      // 优先查找tool_response消息，因为它包含完整的output数据
      const toolResponseMessage = messages.find((msg: any) => 
        msg.role === 'assistant' && msg.type === 'tool_response'
      );
      
      if (toolResponseMessage) {
        console.log('找到tool_response消息:', toolResponseMessage.content);
        try {
          // 尝试解析tool_response中的JSON
          const toolData = JSON.parse(toolResponseMessage.content);
          if (toolData.output) {
            console.log('从tool_response提取output数据:', toolData.output);
            // 将output数据包装成我们期望的格式
            return JSON.stringify({
              ...toolData.output,
              // 确保有基本字段
              title: toolData.output.title || '未提取到标题',
              cover: toolData.output.imageList?.[0]?.urlPre || 
                     toolData.output.imageList?.[0]?.urlDefault || 
                     '无封面',
              tags: toolData.output.tagList?.map((tag: any) => tag.name) || [],
              author: toolData.output.user?.nickname || '未知作者'
            });
          }
        } catch (error) {
          console.error('解析tool_response失败:', error);
        }
      }

      // 如果没有找到tool_response，回退到answer消息
      const assistantMessage = messages.find((msg: any) => 
        msg.role === 'assistant' && msg.type === 'answer'
      );

      if (assistantMessage) {
        console.log('找到AI回复:', assistantMessage.content);
        return assistantMessage.content;
      }

      // 如果没有找到助手消息，返回所有消息内容
      const allContent = messages
        .filter((msg: any) => msg.role === 'assistant')
        .map((msg: any) => msg.content)
        .join('\n');

      return allContent || '未获取到有效回复';

    } catch (error) {
      console.error('获取消息失败:', error);
      throw error;
    }
  }

  // 解析AI返回的结构化数据
  parseXHSResponse(response: string): any {
    try {
      console.log('开始解析响应:', response);
      
      // 尝试直接解析JSON
      if (response.trim().startsWith('{')) {
        const parsed = JSON.parse(response);
        console.log('解析后的数据:', parsed);
        
        // 如果有output字段，将其内容提升到顶级
        if (parsed.output) {
          console.log('找到output字段:', parsed.output);
          return {
            ...parsed,
            ...parsed.output  // 将output中的内容合并到顶级
          };
        }
        
        return parsed;
      }
      
      // 如果不是JSON格式，尝试提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        console.log('从文本中提取的JSON:', parsed);
        
        // 如果有output字段，将其内容提升到顶级
        if (parsed.output) {
          console.log('找到output字段:', parsed.output);
          return {
            ...parsed,
            ...parsed.output  // 将output中的内容合并到顶级
          };
        }
        
        return parsed;
      }
      
      // 如果没有找到JSON，返回原始响应
      console.log('未找到JSON，返回原始响应');
      return { content: response };
    } catch (error) {
      console.error('解析响应失败:', error);
      return { content: response };
    }
  }
} 