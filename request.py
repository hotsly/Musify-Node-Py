import asyncio
import aiohttp

async def fetch_tracks(session, url, headers, params):
    async with session.get(url, headers=headers, params=params) as response:
        if response.status == 200:
            return await response.json()
        else:
            print("Error:", response.status, await response.text())
            return None

async def main(query):
    url = "https://api.spotify.com/v1/search"
    limit = 50  # Max number of items per request
    tasks = []  # List to hold tasks
    total_results = []  # To store all results
    headers = {
        "Authorization": "Bearer BQBQ-zV4ePP8oMGHeKAJRianf6RhpN-JfgJN9RGCqh_w6w3ksPckFxdw_UDc4TmokK6GX74wvxrTILy1hMQsJ6BuJSpJ1occtGPhzi2HnkAlWBoBZNw",
        "Accept": "application/json",
        "Content-Type": "application/json"
    }

    # Create a session for making requests
    async with aiohttp.ClientSession() as session:
        for offset in range(0, 1000, limit):  # Adjust as needed
            params = {
                "q": query,
                "type": "track",
                "limit": limit,
                "offset": offset
            }
            tasks.append(fetch_tracks(session, url, headers, params))

        # Wait for all tasks to complete and gather results
        results = await asyncio.gather(*tasks)

        # Process results
        for result in results:
            if result and 'tracks' in result:
                total_results.extend(result['tracks']['items'])

    # Print the total number of tracks retrieved
    print(f"Total tracks retrieved: {len(total_results)}")
    for track in total_results:
        print(track['name'], "by", track['artists'][0]['name'])

# Run the main function
if __name__ == "__main__":
    query = "Order Taker"
    asyncio.run(main(query))
