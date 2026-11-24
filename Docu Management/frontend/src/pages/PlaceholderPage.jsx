export function PlaceholderPage({
    title,
    description = "This section is currently under development.",
}) {
    return (
        <section className="panel empty-workspace">
            <h2>{title}</h2>
            <p>{description}</p>
        </section>
    );
}

export default PlaceholderPage;