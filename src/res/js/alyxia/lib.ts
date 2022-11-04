export function formatDate(str: string) {
    const date = new Date();
    date.setMonth(parseInt(str.slice(2, 4)) - 1);

    const day = str.slice(0, 2);
    const month = date.toLocaleString("en-US", { month: "long" });
    const year = str.slice(4, 8);

    return `${day} ${month} ${year}`;
}