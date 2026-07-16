export function isSupportedFireflyExerciseUrl(url: URL): boolean {
  const pageSources = url.searchParams.getAll("pageSource");
  return (
    url.origin === "https://www.fireflyau.com" &&
    url.pathname === "/ptehome/exercise" &&
    (pageSources.length === 0 ||
      (pageSources.length === 1 && pageSources[0] === "yc"))
  );
}
