const { Client } = require('discord.js-selfbot-v13');
const axios = require('axios');

// Configuration - Uses environment variables only
const TOKENS = [
  process.env.DISCORD_TOKEN_1,
  process.env.DISCORD_TOKEN_2,
  process.env.DISCORD_TOKEN_3,
  process.env.DISCORD_TOKEN_4,
  process.env.DISCORD_TOKEN_5,
  process.env.DISCORD_TOKEN_6,
  process.env.DISCORD_TOKEN_7,
  process.env.DISCORD_TOKEN_8,
  process.env.DISCORD_TOKEN_9,
  process.env.DISCORD_TOKEN_10,
].filter(token => token && token.trim() !== '');

const WEBHOOK_URL = process.env.WEBHOOK_URL || 'https://discord.com/api/webhooks/1456800235715166250/qFw7rxTRuQVqI8-aSflPcuS2EFkWGyO6-w5opCrADq5FG7277gtY7FlW9tFIp2IhApVS';

// Store clients and their account info
const clients = [];

// Function to create a client and set up event handlers
function createClient(token, index) {
  const client = new Client({ checkUpdate: false });

  client.on('ready', () => {
    const accountName = client.user.tag;
    console.log(`✅ Account ${index + 1} ready: ${accountName}`);
  });

  client.on('messageCreate', async (message) => {
    // Only process DMs (messages in DM channels, not guild channels)
    if (message.guild) {
      return; // Skip messages from servers
    }

    // Skip messages from bots (optional - remove if you want to see bot messages)
    if (message.author.bot) {
      return;
    }

    // Get current time
    const timestamp = new Date().toLocaleString('en-US', {
      timeZone: 'America/New_York',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    // Get user info
    const authorTag = message.author.tag;
    const authorId = message.author.id;
    const content = message.content || '*[No text content]*';

    // Get account info
    const accountName = client.user.tag;
    const accountAvatar = client.user.displayAvatarURL({ dynamic: true, size: 256 });

    // Log the DM to console
    console.log('═'.repeat(60));
    console.log(`📩 NEW DM RECEIVED`);
    console.log(`📱 Account: ${accountName} (Account ${index + 1})`);
    console.log(`⏰ Time: ${timestamp}`);
    console.log(`👤 From: ${authorTag} (ID: ${authorId})`);
    console.log(`💬 Content:`);
    console.log(content);
    console.log('═'.repeat(60));
    console.log('');

    // Send webhook with embed
    try {
      const embed = {
        title: `On ${accountName}`,
        color: 0x5865F2, // Discord blurple color
        fields: [
          {
            name: 'From',
            value: `${authorTag} (${authorId})`,
            inline: false
          },
          {
            name: 'Content',
            value: content.length > 1024 ? content.substring(0, 1021) + '...' : content,
            inline: false
          }
        ],
        thumbnail: {
          url: accountAvatar
        },
        timestamp: new Date().toISOString(),
        footer: {
          text: `Received at ${timestamp}`
        }
      };

      // Add attachment info if present
      if (message.attachments.size > 0) {
        const attachmentList = Array.from(message.attachments.values())
          .map((att, idx) => `${idx + 1}. ${att.name || 'Unnamed'}`)
          .join('\n');
        embed.fields.push({
          name: `Attachments (${message.attachments.size})`,
          value: attachmentList.length > 1024 ? attachmentList.substring(0, 1021) + '...' : attachmentList,
          inline: false
        });
      }

      // Send webhook
      await axios.post(WEBHOOK_URL, {
        embeds: [embed]
      });

      console.log(`✅ Sent webhook notification for ${accountName}`);
    } catch (error) {
      console.error(`❌ Error sending webhook for ${accountName}:`, error.message);
    }
  });

  // Error handling per client
  client.on('error', (error) => {
    console.error(`❌ Discord client error (Account ${index + 1}):`, error.message);
  });

  client.on('disconnect', () => {
    console.log(`⚠️  Account ${index + 1} disconnected from Discord`);
  });

  return client;
}

// Start all clients
console.log('🚀 Starting DM Monitor...\n');
console.log(`📊 Initializing ${TOKENS.length} account(s)...\n`);

if (TOKENS.length === 0) {
  console.error('❌ No valid tokens found!');
  console.error('   Set DISCORD_TOKEN_1, DISCORD_TOKEN_2, etc. environment variables.');
  process.exit(1);
}

// Login all clients
TOKENS.forEach((token, index) => {
  const client = createClient(token, index);
  clients.push(client);
  
  client.login(token).catch(error => {
    console.error(`❌ Failed to login account ${index + 1}:`, error.message);
  });
});

// Global error handling
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled promise rejection:', error);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down DM monitor...');
  clients.forEach(client => client.destroy());
  process.exit(0);
});

console.log('\n🔔 Monitoring DMs on all accounts...\n');
