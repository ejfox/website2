export function countWords(article) {
  const words = article.excerpt.children
    .filter((node) => node.tag === 'p' || node.tag === 'h1' || node.tag === 'h2' || node.tag === 'h3' || node.tag === 'h4' || node.tag === 'blockquote')
    .map((node) => node.children)
    .flat()
    .filter((node) => node.type === 'text')
    .map((node) => node.value)
    .join(' ')
    .split(' ')
    .filter((word) => word.length > 0)
  return words.length
}

export function isValidHttpUrl(string) {
  let url;
  
  try {
    url = new URL(string);
  } catch (_) {
    return false;  
  }

  return url.protocol === "http:" || url.protocol === "https:";
}