const { Client } = require('discord.js-selfbot-v13');
const axios = require('axios');

const TOKEN = process.env.DISCORD_TOKEN_1;
const WEBHOOK_URL = 'https://discord.com/api/webhooks/1456800235715166250/qFw7rxTRuQVqI8-aSflPcuS2EFkWGyO6-w5opCrADq5FG7277gtY7FlW9tFIp2IhApVS';

if (!TOKEN) {
  console.error('❌ DISCORD_TOKEN_1 not set!');
  process.exit(1);
}

const client = new Client({ checkUpdate: false });

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

// Process raw events since messageCreate might not fire
client.on('raw', async (packet) => {
  if (packet.t === 'MESSAGE_CREATE') {
    const data = packet.d;
    
    console.log(`\n[RAW] MESSAGE_CREATE received`);
    console.log(`   Channel ID: ${data.channel_id}`);
    console.log(`   Author ID: ${data.author?.id}`);
    
    // Check if it's a DM (no guild_id means it's a DM)
    if (data.guild_id) {
      console.log(`   ⏭️  Server message, skipping`);
      return;
    }

    // Get the channel to verify it's a DM
    const channel = client.channels.cache.get(data.channel_id);
    if (channel && channel.type !== 1 && channel?.type !== 3) {
      // Type 1 = DM, Type 3 = Group DM
      console.log(`   ⏭️  Not a DM channel type, skipping`);
      return;
    }

    // Skip bot messages
    if (data.author?.bot) {
      console.log(`   ⏭️  Bot message, skipping`);
      return;
    }

    console.log(`\n✅ [DM DETECTED] Processing from raw event...`);
    
    const authorTag = data.author ? `${data.author.username}#${data.author.discriminator}` : 'Unknown';
    const authorId = data.author?.id || 'Unknown';
    const content = data.content || '*[No text content]*';
    
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
            value: `${authorTag} (${authorId})`,
            inline: false
          },
          {
            name: 'Content',
            value: content.substring(0, 1024),
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

      // Add attachments if present
      if (data.attachments && data.attachments.length > 0) {
        const attachmentList = data.attachments
          .map((att, idx) => `${idx + 1}. ${att.filename || 'Unnamed'}`)
          .join('\n');
        embed.fields.push({
          name: `Attachments (${data.attachments.length})`,
          value: attachmentList.substring(0, 1024),
          inline: false
        });
      }

      console.log(`   📤 Sending webhook...`);
      await axios.post(WEBHOOK_URL, { embeds: [embed] });
      console.log(`   ✅ Webhook sent successfully!\n`);
    } catch (error) {
      console.error(`   ❌ Webhook error:`, error.message);
    }
  }
});

// Also keep messageCreate as backup
client.on('messageCreate', async (message) => {
  console.log(`\n[MESSAGE CREATE] Event fired`);
  if (!message.guild) {
    console.log(`   DM from ${message.author.tag}`);
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
    console.log('✅ Login initiated');
  })
  .catch(error => {
    console.error('❌ Login failed:', error.message);
    process.exit(1);
  });
