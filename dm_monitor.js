const { Client } = require('discord.js-selfbot-v13');
const axios = require('axios');

// Test with just one account first
const TOKEN = process.env.DISCORD_TOKEN_1;
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1456800235715166250/qFw7rxTRuQVqI8-aSflPcuS2EFkWGyO6-w5opCrADq5FG7277gtY7FlW9tFIp2IhApVS';

if (!TOKEN) {
  console.error('❌ DISCORD_TOKEN_1 not set!');
  process.exit(1);
}

console.log('🔑 Token length:', TOKEN ? TOKEN.length : 0);
console.log('🔑 Token starts with:', TOKEN ? TOKEN.substring(0, 10) + '...' : 'N/A');

const client = new Client({ checkUpdate: false });

// Test webhook first
async function testWebhook() {
  try {
    await axios.post(WEBHOOK_URL, {
      content: '🔔 Testing webhook connection...'
    });
    console.log('✅ Webhook test successful\n');
  } catch (error) {
    console.error('❌ Webhook test failed:', error.message);
  }
}

client.on('ready', () => {
  console.log(`✅ Account ready: ${client.user.tag}`);
  console.log(`🔔 Monitoring DMs...\n`);
});

client.on('messageCreate', async (message) => {
  console.log(`[DEBUG] Message received! Guild: ${message.guild ? 'Yes' : 'No (DM)'}`);
  
  if (message.guild) return;
  if (message.author.bot) return;

  console.log(`[DEBUG] Processing DM from ${message.author.tag}`);
  
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

  try {
    const embed = {
      title: `On ${client.user.tag}`,
      color: 0x5865F2,
      fields: [
        {
          name: 'From',
          value: `${message.author.tag} (${message.author.id})`,
          inline: false
        },
        {
          name: 'Content',
          value: message.content || '*[No text content]*',
          inline: false
        }
      ],
      thumbnail: {
        url: client.user.displayAvatarURL({ dynamic: true, size: 256 })
      },
      timestamp: new Date().toISOString()
    };

    await axios.post(WEBHOOK_URL, { embeds: [embed] });
    console.log(`✅ Webhook sent for DM from ${message.author.tag}`);
  } catch (error) {
    console.error(`❌ Webhook error:`, error.message);
  }
});

client.on('error', (error) => {
  console.error('❌ Client error:', error.message);
  console.error('❌ Error stack:', error.stack);
});

client.on('warn', (warning) => {
  console.log('⚠️  Client warning:', warning);
});

client.on('debug', (info) => {
  // Only log important debug info
  if (info.includes('WS') || info.includes('Heartbeat') || info.includes('READY')) {
    console.log('[DEBUG]', info);
  }
});

process.on('unhandledRejection', (error) => {
  if (error && error.message && (
    error.message.includes("Cannot read properties of null (reading 'all')") ||
    error.message.includes('ClientUserSettingManager')
  )) {
    return;
  }
  console.error('❌ Unhandled rejection:', error.message);
  if (error.stack) {
    console.error('Stack:', error.stack);
  }
});

console.log('🚀 Starting DM Monitor (Single Account Test)...\n');
testWebhook();

console.log('🔐 Attempting to login...');
client.login(TOKEN)
  .then(() => {
    console.log('✅ Login promise resolved');
  })
  .catch(error => {
    console.error('❌ Login promise rejected:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Full error:', error);
    process.exit(1);
  });

// Timeout to check if ready event fires
setTimeout(() => {
  if (!client.user) {
    console.log('\n⚠️  Warning: Client not ready after 10 seconds');
    console.log('⚠️  Client status:', client.ws ? client.ws.status : 'No WS connection');
  }
}, 10000);
