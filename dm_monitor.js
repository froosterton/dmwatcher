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

client.on('ready', () => {
  console.log(`✅ Account ready: ${client.user.tag}`);
  console.log(`🔔 Monitoring DMs...\n`);
});

// Listen to ALL events to see what's happening
client.on('messageCreate', async (message) => {
  console.log(`\n📨 [MESSAGE CREATE] Received!`);
  console.log(`   Author: ${message.author.tag} (${message.author.id})`);
  console.log(`   Channel: ${message.channel.type} - ${message.channel.id}`);
  console.log(`   Guild: ${message.guild ? message.guild.name : 'None (DM)'}`);
  console.log(`   Content: ${message.content || '[No content]'}`);
  
  // Only process DMs
  if (message.guild) {
    console.log(`   ⏭️  Skipping server message`);
    return;
  }

  if (message.author.bot) {
    console.log(`   ⏭️  Skipping bot message`);
    return;
  }

  console.log(`\n✅ [DM PROCESSING] Valid DM detected!`);
  
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
    const accountName = client.user.tag;
    const accountAvatar = client.user.displayAvatarURL({ dynamic: true, size: 256 });

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
      thumbnail: {
        url: accountAvatar
      },
      timestamp: new Date().toISOString()
    };

    console.log(`   📤 Sending webhook...`);
    await axios.post(WEBHOOK_URL, { embeds: [embed] });
    console.log(`   ✅ Webhook sent successfully!\n`);
  } catch (error) {
    console.error(`   ❌ Webhook error:`, error.message);
  }
});

// Also listen to raw events as backup
client.on('raw', (packet) => {
  // Only log MESSAGE_CREATE events
  if (packet.t === 'MESSAGE_CREATE') {
    console.log(`\n[RAW EVENT] MESSAGE_CREATE received`);
    console.log(`   Channel ID: ${packet.d.channel_id}`);
    console.log(`   Author ID: ${packet.d.author?.id}`);
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
  })
  .catch(error => {
    console.error('❌ Login failed:', error.message);
    process.exit(1);
  });
