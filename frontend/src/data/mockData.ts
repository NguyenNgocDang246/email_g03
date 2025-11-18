export interface Mailbox {
  id: string;
  name: string;
  icon: string;
  unreadCount: number;
}

export interface Email {
  id: number;
  from: string;
  subject: string;
  preview: string;
  timestamp: string;
  isRead: boolean;
  isStarred: boolean;
  body: string;
}

export const mockMailboxes: Mailbox[] = [
  { id: "inbox", name: "Inbox", icon: "📥", unreadCount: 1377 },
  { id: "starred", name: "Starred", icon: "⭐", unreadCount: 0 },
  { id: "snoozed", name: "Snoozed", icon: "🕐", unreadCount: 0 },
  { id: "sent", name: "Sent", icon: "📤", unreadCount: 0 },
  { id: "drafts", name: "Drafts", icon: "📝", unreadCount: 7 },
  { id: "archive", name: "Archive", icon: "📦", unreadCount: 0 },
  { id: "trash", name: "Trash", icon: "🗑️", unreadCount: 0 },
];


export const mockEmails = [
  {
    id: 1,
    from: "TopDev",
    subject:
      "[TopDev] 12_0167 Mạnh Trọng Kiên ơi! Chào mừng bạn đến với TopDev, hãy bắt đầu hành trình sự nghiệp ngay...",
    preview:
      "Chào mừng bạn đến với TopDev! Hãy bắt đầu hành trình sự nghiệp của bạn",
    timestamp: "5 Nov",
    isRead: false,
    isStarred: false,
    body: "<p>Xin chào,</p><p>Chào mừng bạn đến với TopDev! Chúng tôi rất vui được đồng hành cùng bạn trong hành trình phát triển sự nghiệp.</p>",
  },
  {
    id: 2,
    from: "LinkedIn",
    subject: "Kien, you have new application updates this week",
    preview: "Check out the status of your applications on LinkedIn",
    timestamp: "5 Nov",
    isRead: false,
    isStarred: false,
    body: "<p>Hi Kien,</p><p>You have new updates on your job applications this week. Check your LinkedIn profile to see the latest status.</p>",
  },
  {
    id: 3,
    from: "Google Maps",
    subject: "Your photo reached 50 views 📸",
    preview: "Let's celebrate your impact",
    timestamp: "5 Nov",
    isRead: false,
    isStarred: true,
    body: "<p>Congratulations!</p><p>Your photo on Google Maps has reached 50 views. Thank you for contributing to the community!</p>",
  },
  {
    id: 4,
    from: "Khánh Nguyễn Huy",
    subject:
      "Due tomorrow: 'IA4 - React Authentication with JWT (Access + Refresh)'",
    preview:
      "Notification settings 2509-AWAD-22/3 Advanced Web Application Development",
    timestamp: "4 Nov",
    isRead: true,
    isStarred: false,
    body: "<p>Hi,</p><p>This is a reminder that your assignment is due tomorrow. Please make sure to submit on time.</p>",
  },
  {
    id: 5,
    from: "Nguyễn Minh Khang",
    subject:
      "[JIRA] (OPS-307) Tôi muốn xem lại các diagram đã tạo sau khi tạo thành công.",
    preview: "uynhhuc810 and Nguyễn Minh Khang made updates",
    timestamp: "4 Nov",
    isRead: true,
    isStarred: false,
    body: "<p>JIRA Issue Updated</p><p>The diagram viewing feature has been updated. Please review the changes.</p>",
  },
  {
    id: 6,
    from: "Nguyễn Minh Khang",
    subject:
      "[JIRA] (OPS-249) BE: Implement /export endpoint to export srs documents",
    preview: "Nguyễn Minh Khang made 2 updates BA, Code Review",
    timestamp: "4 Nov",
    isRead: true,
    isStarred: false,
    body: "<p>Backend Implementation Complete</p><p>The export endpoint has been implemented and is ready for testing.</p>",
  },
  {
    id: 7,
    from: "Nguyễn Minh Khang",
    subject:
      "[JIRA] (OPS-309) BE: Implement an endpoint to list the generated diagrams.",
    preview: "Nguyễn Minh Khang 1 made an update",
    timestamp: "4 Nov",
    isRead: false,
    isStarred: false,
    body: "<p>New Endpoint Available</p><p>The diagram listing endpoint is now available for integration.</p>",
  },
  {
    id: 8,
    from: "Nguyễn Minh Khang",
    subject:
      "[JIRA] (OPS-308) BE: Implement an endpoint to return the generated diagram.",
    preview: "Nguyễn Minh Khang 1 made an update",
    timestamp: "4 Nov",
    isRead: true,
    isStarred: false,
    body: "<p>Diagram Retrieval Endpoint</p><p>You can now retrieve individual diagrams using the new endpoint.</p>",
  },
  {
    id: 9,
    from: "Render",
    subject: "Your free Render database has expired: Ba_Copilot_DB",
    preview: "Render Your free Render PostgreSQL database has expired",
    timestamp: "4 Nov",
    isRead: true,
    isStarred: false,
    body: "<p>Database Expiration Notice</p><p>Your free PostgreSQL database has expired. Please upgrade to continue using the service.</p>",
  },
  {
    id: 10,
    from: "The Mailgun Team",
    subject: "Your account is missing its domain",
    preview: "Can we help?",
    timestamp: "4 Nov",
    isRead: true,
    isStarred: false,
    body: "<p>Account Configuration</p><p>We noticed your account is missing domain configuration. Let us help you set it up.</p>",
  },
  {
    id: 11,
    from: "GitHub",
    subject:
      "[GitHub] @Khang080704 has invited you to join the @HCMUS-Software-Architecture organization",
    preview: "@Khang080704 has invited you to join",
    timestamp: "4 Nov",
    isRead: true,
    isStarred: false,
    body: "<p>GitHub Invitation</p><p>You have been invited to join the HCMUS Software Architecture organization on GitHub.</p>",
  },
  {
    id: 12,
    from: "LinkedIn",
    subject: "Your application was viewed by IMT Solutions",
    preview: "Your application was viewed by IMT Solutions",
    timestamp: "4 Nov",
    isRead: true,
    isStarred: false,
    body: "<p>Application Update</p><p>Great news! IMT Solutions has viewed your application. Keep an eye out for further updates.</p>",
  },
];