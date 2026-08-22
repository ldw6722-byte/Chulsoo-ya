const AUTO_REGISTRATION_TITLE = /^(.*) \[등록 (\d{4}\.\d{2}\.\d{2} \d{2}:\d{2})\]$/

export const splitNoticeTitle = (title: string) => {
  const matched = title.match(AUTO_REGISTRATION_TITLE)
  return matched ? { title: matched[1], registrationTime: matched[2] } : { title, registrationTime: null }
}
