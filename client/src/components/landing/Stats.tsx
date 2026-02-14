const stats = [
    {
        value: '10K+',
        label: 'Active Learners',
        suffix: '',
    },
    {
        value: '50K+',
        label: 'Courses Created',
        suffix: '',
    },
    {
        value: '2M+',
        label: 'Concepts Mapped',
        suffix: '',
    },
    {
        value: '98',
        label: 'Satisfaction Rate',
        suffix: '%',
    },
]

export function Stats() {
    return (
        <section className="relative py-24 px-6">
            <div className="max-w-5xl mx-auto">
                <div className="glass rounded-3xl p-8 sm:p-12">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        {stats.map((stat, index) => (
                            <div
                                key={stat.label}
                                className="text-center"
                            >
                                <div className="text-4xl sm:text-5xl font-bold gradient-text mb-2">
                                    {stat.value}{stat.suffix}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    )
}
