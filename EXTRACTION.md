# Extraction Process and Reasoning

## Overall

This document will walk you through not only my thinking process, but also what I encountered during the journey and how I handled it.

About the Accuracy:

I didn't assume the first extraction was correct. Every iteration was followed by manual verification against the original EPDs.

There were several situations where extraction could fail:

- Missing values — A missing life-cycle stage does not necessarily mean zero. I explicitly distinguish between "Not Available", "Not Declared", and actual numeric values so the application never treats missing data as zero.
- OCR limitations — Some EPDs contained rotated table images that the local OCR parser failed to recognize. When I found missing values during verification, I traced them back to the original PDF, identified the OCR limitation, and validated the same document using LlamaParse. This confirmed that the data existed but had not been extracted correctly.
- Aggregation ambiguity — One EPD described multiple product variants across multiple batching plants. Instead of forcing them into a single comparable product, I changed the ingestion and extraction strategy to create separate products while preserving their provenance.

Every extracted carbon figure is linked back to its source EPD. When I wasn't confident about a value,
I preferred marking it as unavailable or not comparable rather than inventing or inferring data.
In this assessment, preserving data integrity was more important than maximizing completeness.

About the Strategy:

- Instead of PDFs to JSONs. Product by product
- I prefer building a base system, where
  - I pass each product into and build up the foundation indexed knowledge.
  - Data extract is based on indexed information for speed and flexibility.
    - This helps scale the product with any shape of data, not just the one of this assessment
    - Moreover, not just embodied carbon information of the product, the filters (facets) also created dynamically from here
    - Super convenient (facets gen), automatically aggregating (a single `products.json` contains all products with aggreated data)

The final model/architecture looks like:

> PDFs ---[static parse]--> MDs ---[ingest to]--> LLM wiki ---[extract to]--> JSONs ---[feed to]--> App

## Timeline

Jun 30:
- analyze assessment
- verify ideas, initiatives
- try tools
- explore long-term knowledge base building (wiki)
- start integrate through a couple approaches

Jul 01:
- optimize the ingestion
- enhance wiki indexing
- extract data
- evaluate extracted data
- plan to improve data extraction

Jul 02:
- optimize the extraction
- build and deploy app
- evaluate, fix bug, improve UX (not UI)

Jul 03:
- improve wiki with deeper analysis
- improve extracted data
- improve app and submit

## Journal

At first glance, the requirement has a basic form:

> PDFs ---[extract to]--> JSONs ---[feed to]--> App

Construction and Carbon reduction is a new topic to me. Therefore, this was not enough.

I need a big picture of what I am gonna build, so I carefully check the whole "Assessment Brief.md".

First, a few questions:
- what is the scope of the app?
- what kind of data does the assessment look for (for the final application)?
- what kind of data integrity?
- what are terminologies I need to learn?
- how to handle data provenance?

Here are what I learnt:
- An demo, about concrete product list
- User can filter and see the embodied carbon value to compare
- The data at least requires:
  - embodied carbon for each stage in life cycle
  - compressive strength
  - manufactoring location
  - must have cite
- The main terminology I need to understand is:
  - what is "embodied carbon"?
  - what is "life cycle"?
  - how does it look like?
  - how to capture/measure it?

So that is at least more compact detail about the vision or the goal I need to achieve for the assessment.

Let's switch to data POV, I skim through the provided PDF files. Here is what I learnt:
- 3 EPD providers/programs: EPD Hub, EPD AustralAsia, EPD IES
- A few manufacturers: Boral, Adbri, Holcim, etc...
- Life cycle: A, B, C, D (and their substeps)
- Not all products have all stages
- misc...

Overall, scanning these resources, I learnt that:
> Although they have different art styles and layouts, they share some common patterns.
> Products belong to a same providers/programs usually share some data format.
> E.g: some always has Table of Content, others might open with 2 columns technical table

At this point, I had:
- A vision for what app should I build
- Basic knowledge about carbon

But some uncertainties:
- Is my understanding of data correct?
- How to extract data and how much does it cost?
- How to make those figures tracable as requirement in the assessment?

With the basic instincts of software engineer, I knew it is not simply sending PDF to a blackbox 
and receive JSON.
- If I want to change data structure, I don't want to repeat all procedures
- is data aggregated automatically during extraction or later in the app?

It must be something in the middle.

And the quick answer in my mind was: a knowledge base.

With that, the first thing I looked for was RAG, but I soon found it too complicated.
There was one thing I want to try long ago that is Karpathy's LLM Wiki. It could be the alternative.

And the fomular now is:

> PDFs ---[ingest to]--> LLM wiki ---[extract to]--> JSONs ---[feed to]--> App

So I set my direction to that point - LLM wiki.

Follow the path, I soon found it doesn't work well with PDFs.

The PDF is kind of rich content type. It means not only text, it includes images, graphs, etc...

Who knows what I might miss if I ignore those

So new set of questions:
- how to deal with PDF?
- how to perform OCR?
- what tools? costs?
- how well it performs?

Finally, I found a local-first PDF parser with these characteristics:
- Support OCR
- No GPU required
- No subscription
- Open source with 11.3k stars
- Produce spacial data (possible for traceback later)
- Support batch processing

At least for an MVP demo, those criteria were enough

That is [LiteParse](https://developers.llamaindex.ai/liteparse/) by LlamaIndex

One benefit of this approach is that I can reduce the input size significantly before extracting.
A PDF file is several MB in size while the parsed version (with spacial data) is only measured in KB.
The total resources size is 42MB while the parsed version size is only 16MB total which is 60.2% reduction.

Now the flow looks like:

> PDFs ---[parse]--> Spacial JSONs ---[ingest to]--> LLM wiki ---[extract to]--> JSONs ---[feed to]--> App

At this point, I had tools, and the approach. I could start building my knowledge base that's ready for data extraction.

It's hard to describe the process of building the knowledge base in detail.
You can check git history to see those iterations.
However, I can briefly describe them like this:

- Start with a single product
- Ingest then evaluate and incorporate feedback to llm-wiki/AGENTS.md
- Add the 2nd product and observe the wiki grows
- Research, refactor the wiki structure to enhance how the wiki create the index
- Evaluate with new product and feedback

Follow that path, I had 9 products ingested into the wiki:
- 4 from EPD Hub
- 3 from EPD IES
- 2 from EPD Astralasia

I think these data is flexible enough for validating the data extraction.

I noticed that the time consuming is too high. The token consumption was too high.
Data extraction was too slow.

I switched the approach.

I didn't use spacial JSON anymore. I switch to normal Markdown.

Cons:
- Not as detailed as the spatial JSON.
Pros:
- Pure text, so the content is not fragmented by spacial items => better for LLM
- About one-tenth the size => better performance and lower cost
- Human-readable too

I did't throw away the spacial JSON => it could be used for generate direct locations for data provenance

So now the formula is:

> PDFs ---[parse]--> MDs ---[ingest to]--> LLM wiki ---[extract to]--> JSONs ---[feed to]--> App

In practice, this proved true:
- Ingest a single product always less than 10mins (prev 20mins each)
- Data extraction was surprisingly fast ~11mins (prev 30mins, sometime unfinished)

At this point, I balance the data:
- 3 from EPD Hub
- 3 from EPD IES
- 3 from EPD Astralasia

As we have a hard rule about data provenance, and not automatically convert missing data to 0,
I found that 2 of 9 products above returns "Not Comparable" instead of value.

I traced back to source file and found that, the missing data was actually available in the PDFs
but it was inside an image: This image represents a table but rotated vertically.

Yeah, fair point, a free version llamaindex/liteparse sure cannot handle it with the built-in no GPU OCR.

I tried external OCR as recommended by the liteparse

- EASY OCR
  - claimed: balance
  - actual:  lower quality than the built-in
- SURYA OCR
  - claimed: excellence
  - actual:  was not able to complete

I finally tried the commercial one: LlamaIndex/LlamaParse 
Needless to say, result was clearly the winner.

The table images was parsed correctly and embedded inside the MD as HTML which is also good for LLM

For the scope and the purpose of this project, I decide to update 1 file only. Why?
- No need to fix them all coz time consuming, cost-inefficient.
- This is demo, not final product. What it needs is proving the concept.
- I also need example of "missing" data (not auto convert to 0)
- MVP first mindset => runnable product is better than nothing.

In the prompt I used to extract data, I asked the agent to use scripts where needed and I saved the script
so later I can rerun them without LLM cost.

So far so good, I have 9 products:
- 7 comparable
- 1 with comparable issue (has value but low confidence)
- 1 incomparable coz of its EPD aggregates mutliple products and multiple batching-plants
- Full vision of stages:
  - A1-A3, A4, A5
  - B1, B2, B3, B4, B5, B6, B7
  - C1, C2, C3, C4
  - D
- Possible stage status:
  - Has value
  - Not available
  - Not declared

From this point, I spent the rest of the day building the web app.
Once it was runnable, I deployed to Vercel.

It is ready to submit, but I am not really happy with the:

> 1 incomparable coz of its EPD aggregates mutliple products and multiple batching-plants

I revisited the wiki, optimize prompt to allow deeper document ingestion
- Break incomparable product to multiple comparable products.
- Reflected that mindset to extracted data
- Updated the app for that.

This is amazing, from 9 EPDs and 9 products, now it became:

> 9 EPDs and 28 products (due to multiple variants combined with multiple batching plants)

Finally, last touch before submitting
