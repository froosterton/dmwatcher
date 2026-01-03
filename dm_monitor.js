const { Client } = require('discord.js-selfbot-v13');
const axios = require('axios');

const TOKEN = process.env.DISCORD_TOKEN_1;
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1456800235715166250/qFw7rxTRuQVqI8-aSflPcuS2EFkWGyO6-w5opCrADq5FG7277gtY7FlW9tFIp2IhApVS';

if (!TOKEN) {
  console.error('❌ DISCORD_TOKEN_1 not set!');
  process.exit(1);
}

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

// Check if client is ready (even if event didn't fire)
function checkClientReady() {
  if (client.user) {
    console.log(`✅ Client is ready: ${client.user.tag}`);
    console.log(`🔔 Monitoring DMs...\n`);
    return true;
  }
  return false;
}

client.on('ready', () => {
  console.log(`✅ Account ready: ${client.user.tag}`);
  console.log(`🔔 Monitoring DMs...\n`);
});

client.on('messageCreate', async (message) => {
  // Log ALL messages first to see if we're receiving anything
  console.log(`[ALL MESSAGES] Received message from ${message.author.tag} in ${message.guild ? `server: ${message.guild.name}` : 'DM'}`);
  
  // Only process DMs
  if (message.guild) {
    console.log(`[SKIP] Server message, ignoring`);
    return;
  }

  if (message.author.bot) {
    console.log(`[SKIP] Bot message, ignoring`);
    return;
  }

  console.log(`\n[DM DETECTED] Processing DM from ${message.author.tag}`);
  
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
    const accountName = client.user ? client.user.tag : 'Unknown Account';
    const accountAvatar = client.user ? client.user.displayAvatarURL({ dynamic: true, size: 256 }) : '';

    const embed = {
      title: `On ${accountName}`,
      color: 0x5865F2,
      fields: [
        {
          name: 'From',
          value: `${message.author.tag} (${message.author.id})`,
          inline: false
        },
        {
          name: 'Content',
          value: (message.content || '*[No text content]*').substring(0, 1024),
          inline: false
        }
      ],
      timestamp: new Date().toISOString()
    };

    if (accountAvatar) {
      embed.thumbnail = { url: accountAvatar };
    }

    await axios.post(WEBHOOK_URL, { embeds: [embed] });
    console.log(`✅ Webhook sent for DM from ${message.author.tag}\n`);
  } catch (error) {
    console.error(`❌ Webhook error:`, error.message);
  }
});

client.on('error', (error) => {
  console.error('❌ Client error:', error.message);
});

process.on('unhandledRejection', (error) => {
  if (error && error.message && (
    error.message.includes("Cannot read properties of null (reading 'all')") ||
    error.message.includes('ClientUserSettingManager')
  )) {
    return;
  }
  console.error('❌ Unhandled rejection:', error.message);
});

console.log('🚀 Starting DM Monitor...\n');
testWebhook();

client.login(TOKEN)
  .then(() => {
    console.log('✅ Login promise resolved');
    // Check if ready after a short delay
    setTimeout(() => {
      checkClientReady();
    }, 2000);
  })
  .catch(error => {
    console.error('❌ Login failed:', error.message);
    process.exit(1);
  });
