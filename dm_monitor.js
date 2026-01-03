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
let readyCount = 0;

// Test webhook on startup
async function testWebhook() {
  try {
    await axios.post(WEBHOOK_URL, {
      content: '🔔 DM Monitor started! Waiting for DMs...'
    });
    console.log('✅ Webhook test successful\n');
  } catch (error) {
    console.error('❌ Webhook test failed:', error.message);
    console.error('   Please check your WEBHOOK_URL\n');
  }
}

// Suppress specific library errors that are non-fatal
process.on('unhandledRejection', (error) => {
  // Filter out known non-fatal errors from discord.js-selfbot-v13
  if (error && error.message && (
    error.message.includes("Cannot read properties of null (reading 'all')") ||
    error.message.includes('ClientUserSettingManager')
  )) {
    // These are non-fatal library errors, ignore them
    return;
  }
  // Only log other errors
  if (error && error.stack && !error.stack.includes('ClientUserSettingManager')) {
    console.error('❌ Unhandled promise rejection:', error.message);
  }
});

// Function to create a client and set up event handlers
function createClient(token, index) {
  const client = new Client({ 
    checkUpdate: false,
    restRequestTimeout: 30000
  });

  let isReady = false;

  client.on('ready', () => {
    try {
      isReady = true;
      readyCount++;
      const accountName = client.user.tag;
      console.log(`✅ Account ${index + 1} ready: ${accountName}`);
    } catch (error) {
      readyCount++;
      console.log(`✅ Account ${index + 1} ready (username fetch failed)`);
    }
  });

  client.on('messageCreate', async (message) => {
    try {
      console.log(`[DEBUG] Message received on account ${index + 1}, Guild: ${message.guild ? 'Yes' : 'No (DM)'}`);
      
      // Only process DMs (messages in DM channels, not guild channels)
      if (message.guild) {
        return; // Skip messages from servers
      }

      // Skip messages from bots (optional - remove if you want to see bot messages)
      if (message.author.bot) {
        return;
      }

      console.log(`[DEBUG] Processing DM from ${message.author.tag} on account ${index + 1}`);

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
      let accountName = `Account ${index + 1}`;
      let accountAvatar = '';
      
      try {
        if (client.user) {
          accountName = client.user.tag;
          accountAvatar = client.user.displayAvatarURL({ dynamic: true, size: 256 });
        }
      } catch (error) {
        // Fallback if user info unavailable
      }

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
          color: 0x5865F2,
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
          timestamp: new Date().toISOString(),
          footer: {
            text: `Received at ${timestamp}`
          }
        };

        if (accountAvatar) {
          embed.thumbnail = { url: accountAvatar };
        }

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
        console.log(`[DEBUG] Sending webhook for account ${index + 1}...`);
        await axios.post(WEBHOOK_URL, {
          embeds: [embed]
        });

        console.log(`✅ Sent webhook notification for ${accountName}`);
      } catch (error) {
        console.error(`❌ Error sending webhook for ${accountName}:`, error.message);
        if (error.response) {
          console.error(`   Status: ${error.response.status}`);
          console.error(`   Response: ${JSON.stringify(error.response.data)}`);
        }
      }
    } catch (error) {
      console.error(`❌ Error processing message on account ${index + 1}:`, error.message);
    }
  });

  // Error handling per client
  client.on('error', (error) => {
    // Filter out known non-fatal errors
    if (error && error.message && (
      error.message.includes("Cannot read properties of null (reading 'all')") ||
      error.message.includes('ClientUserSettingManager')
    )) {
      return; // Ignore non-fatal errors
    }
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

if (!WEBHOOK_URL) {
  console.error('❌ WEBHOOK_URL not set!');
  process.exit(1);
}

// Test webhook first
testWebhook();

// Login all clients with error handling
TOKENS.forEach((token, index) => {
  try {
    const client = createClient(token, index);
    clients.push(client);
    
    console.log(`🔐 Logging in account ${index + 1}...`);
    client.login(token).then(() => {
      console.log(`✓ Account ${index + 1} login initiated`);
    }).catch(error => {
      console.error(`❌ Failed to login account ${index + 1}:`, error.message);
    });
  } catch (error) {
    console.error(`❌ Error creating client for account ${index + 1}:`, error.message);
  }
});

// Wait a bit then show status
setTimeout(() => {
  console.log(`\n📈 Status: ${readyCount}/${TOKENS.length} accounts ready`);
  console.log('🔔 Monitoring DMs on all accounts...\n');
}, 5000);

process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down DM monitor...');
  clients.forEach(client => {
    try {
      client.destroy();
    } catch (error) {
      // Ignore errors during shutdown
    }
  });
  process.exit(0);
});
